import { getDistanceFromLatLonInMeters, validateCoordinates } from '../utils/geolocation';
import { FirebaseService } from './FirebaseService';
import { 
    LocationUpdateResponse, 
    ValidationResult,
    ProximityNotificationResult,
    NotificationResult,
    Location,
    User,
    FCMPayload
} from '../types';

export class NotificationService {
    private firebaseService: FirebaseService;
    private distanceThreshold: number;
    private throttleMinutes: number;

    constructor() {
        this.firebaseService = new FirebaseService();
        this.distanceThreshold = parseInt(process.env['NOTIFICATION_DISTANCE_THRESHOLD'] || '200');
        this.throttleMinutes = parseInt(process.env['NOTIFICATION_THROTTLE_MINUTES'] || '3');
    }

    async processLocationUpdate(userId: string, locationData: { location: Location }): Promise<LocationUpdateResponse> {
        try {
            console.log('Processing location update for user:', userId);

            // Validaciones básicas
            const validation = this.validateInput(userId, locationData);
            if (!validation.isValid) {
                return { success: false, message: validation.message || 'Validation failed' };
            }

            // Obtener datos del usuario
            const userData = await this.firebaseService.getUserById(userId);
            if (!userData) {
                return { success: false, message: 'User not found' };
            }

            if (userData.role !== 'truck_driver' || !userData.location) {
                return { success: false, message: 'Not a truck driver or no location' };
            }

            // Obtener datos del camión y ruta
            const truckData = await this.firebaseService.getTruckByDriverId(userData.uid);
            if (!truckData) {
                return { success: false, message: 'No truck found' };
            }

            const routeData = await this.firebaseService.getActiveRouteByTruckId(truckData.id_truck);
            if (!routeData || !routeData.uid) {
                return { success: false, message: 'No active route found' };
            }

            console.log('Found active route:', routeData.uid);

            // Procesar notificaciones
            const result = await this.processProximityNotifications(
                userData.location,
                routeData.uid,
                truckData.id_truck
            );

            return {
                success: true,
                message: `Processed ${result.totalCitizens} citizens, sent ${result.notificationsSent} notifications`,
                ...result,
                routeId: routeData.uid,
                truckId: truckData.id_truck
            };

        } catch (error) {
            console.error('Error in processLocationUpdate:', error);
            return { success: false, message: (error as Error).message };
        }
    }

    private async processProximityNotifications(
        truckLocation: Location, 
        routeId: string, 
        truckId: string
    ): Promise<ProximityNotificationResult> {
        const citizens = await this.firebaseService.getCitizensSubscribedToRoute(routeId);
        console.log(`Found ${citizens.length} citizens subscribed to route:`, routeId);

        let notificationsSent = 0;
        const notifications: NotificationResult[] = [];

        for (const citizen of citizens) {
            const notificationResult = await this.processCitizenNotification(
                citizen,
                truckLocation,
                routeId,
                truckId
            );

            if (notificationResult.sent) {
                notificationsSent++;
            }
            notifications.push(notificationResult);
        }

        return {
            totalCitizens: citizens.length,
            notificationsSent,
            notifications
        };
    }

    private async processCitizenNotification(
        citizen: User & { id: string },
        truckLocation: Location,
        routeId: string,
        truckId: string
    ): Promise<NotificationResult> {
        console.log(`🔍 Checking citizen ${citizen.id} (${citizen.name}): hasLocation=${!!citizen.location}, hasFcmToken=${!!citizen.fcmToken}`);

        // Validaciones básicas
        if (!citizen.location) {
            console.log(`❌ Citizen ${citizen.id} has no location, skipping`);
            return { citizenId: citizen.id, sent: false, reason: 'No location' };
        }

        if (!citizen.fcmToken) {
            console.log(`❌ Citizen ${citizen.id} has no FCM token, skipping`);
            return { citizenId: citizen.id, sent: false, reason: 'No FCM token' };
        }

        // Calcular distancia
        console.log(`📍 Truck location: lat=${truckLocation.lat}, long=${truckLocation.long}`);
        console.log(`📍 Citizen location: lat=${citizen.location.lat}, long=${citizen.location.long}`);
        
        const distance = getDistanceFromLatLonInMeters(
            truckLocation.lat,
            truckLocation.long,
            citizen.location.lat,
            citizen.location.long
        );

        console.log(`📏 Distance between truck and citizen ${citizen.id}: ${distance.toFixed(0)}m (threshold: ${this.distanceThreshold}m)`);

        if (distance > this.distanceThreshold) {
            console.log(`❌ Distance ${distance.toFixed(0)}m > ${this.distanceThreshold}m - Too far`);
            return { 
                citizenId: citizen.id, 
                sent: false, 
                reason: 'Too far', 
                distance: distance.toFixed(0) 
            };
        }

        console.log(`✅ Distance check passed: ${distance.toFixed(0)}m <= ${this.distanceThreshold}m`);

        // Verificar throttling
        console.log(`🔍 Checking throttling for citizen ${citizen.id}...`);
        const shouldSend = await this.checkThrottling(citizen.id, routeId);
        if (!shouldSend) {
            console.log(`❌ Notification throttled for citizen ${citizen.id}`);
            return { 
                citizenId: citizen.id, 
                sent: false, 
                reason: 'Throttled', 
                distance: distance.toFixed(0) 
            };
        }

        console.log(`✅ Throttling check passed for citizen ${citizen.id}`);

        // Enviar notificación
        try {
            console.log(`🔔 Sending notification to citizen ${citizen.id}...`);
            await this.sendNotification(citizen, routeId, truckId, distance);
            console.log(`✅ Notification sent successfully to citizen ${citizen.id}`);
            return { 
                citizenId: citizen.id, 
                sent: true, 
                distance: distance.toFixed(0),
                fcmToken: citizen.fcmToken.substring(0, 10) + '...' // Solo mostrar parte del token para logs
            };
        } catch (error) {
            console.error(`❌ Error sending notification to citizen ${citizen.id}:`, error);
            return { 
                citizenId: citizen.id, 
                sent: false, 
                reason: 'Send failed', 
                error: (error as Error).message 
            };
        }
    }

    private async checkThrottling(citizenId: string, routeId: string): Promise<boolean> {
        console.log(`🕐 Checking throttling for citizen ${citizenId}, route ${routeId}...`);
        
        // Temporalmente deshabilitar throttling para testing
        console.log(`✅ Throttling disabled for testing - allowing send`);
        return true;
        
        /* COMENTADO PARA TESTING - DESCOMENTAR DESPUÉS
        const lastNotification = await this.firebaseService.getLastNotification(citizenId, routeId);
        
        if (!lastNotification || !lastNotification.timestamp) {
            console.log(`✅ No previous notification found - allowing send`);
            return true;
        }

        const lastTimestamp = lastNotification.timestamp.toDate();
        const now = new Date();
        const timeDiff = now.getTime() - lastTimestamp.getTime();
        const throttleTime = this.throttleMinutes * 60 * 1000;

        console.log(`🕐 Last notification: ${lastTimestamp.toISOString()}`);
        console.log(`🕐 Current time: ${now.toISOString()}`);
        console.log(`🕐 Time difference: ${Math.round(timeDiff / 1000)}s (need ${this.throttleMinutes * 60}s)`);
        
        const shouldSend = timeDiff >= throttleTime;
        console.log(`🕐 Throttling result: ${shouldSend ? 'ALLOW' : 'THROTTLE'}`);
        
        return shouldSend;
        */
    }

    private async sendNotification(
        citizen: User & { id: string }, 
        routeId: string, 
        truckId: string, 
        distance: number
    ): Promise<void> {
        // Usar el nuevo formato de mensaje para mejor visibilidad en Firebase Console
        const message = {
            token: citizen.fcmToken!,
            notification: {
                title: "🚛 ComasLimpio - ¡Camión Cerca!",
                body: `El camión de basura está a ${distance.toFixed(0)} metros de tu ubicación.`
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                sound: 'default',
                type: 'truck_near',
                truckId: truckId,
                routeId: routeId,
                distance: distance.toFixed(0),
                timestamp: new Date().toISOString()
            },
            android: {
                notification: {
                    channelId: 'comaslimpio_notifications',
                    priority: 'high' as const,
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    icon: 'truck_icon'
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: "🚛 ComasLimpio - ¡Camión Cerca!",
                            body: `El camión de basura está a ${distance.toFixed(0)} metros de tu ubicación.`
                        },
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        console.log(`🔔 Sending enhanced FCM notification to ${citizen.name} (${citizen.fcmToken!.slice(0, 20)}...)`);
        console.log(`🔔 Enhanced message:`, JSON.stringify(message, null, 2));
        
        // Enviar usando el método messaging.send directamente
        const { FirebaseService } = await import('./FirebaseService');
        const firebaseService = new FirebaseService();
        const messaging = firebaseService['messaging'];
        
        const result = await messaging.send(message);
        console.log(`✅ Enhanced FCM notification sent successfully:`, result);

        // Comentar el guardado en Firestore temporalmente para evitar el problema del índice
        // await this.firebaseService.saveNotification(citizen.id, {
        //     type: 'truck_near',
        //     routeId: routeId,
        //     message: "El camión de basura está a menos de 200 metros de tu ubicación.",
        // });
        console.log(`📝 Notification saved to Firestore (temporarily disabled)`);
    }

    validateInput(userId: string, locationData: { location: Location }): ValidationResult {
        if (!userId) {
            return { isValid: false, message: 'UserId is required' };
        }

        if (!locationData || !locationData.location) {
            return { isValid: false, message: 'Location data is required' };
        }

        const { lat, long } = locationData.location;
        if (!validateCoordinates(lat, long)) {
            return { isValid: false, message: 'Invalid coordinates' };
        }

        return { isValid: true };
    }
}
