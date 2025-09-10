import * as admin from 'firebase-admin';
import { initializeFirebase } from '../utils/firebase';
import { normalizeUserData } from '../utils/userHelpers';
import { 
    User, 
    Truck, 
    Route, 
    Notification, 
    FCMPayload 
} from '../types';

export class FirebaseService {
    private admin: typeof admin;
    private db: FirebaseFirestore.Firestore;
    private messaging: admin.messaging.Messaging;

    constructor() {
        this.admin = initializeFirebase();
        this.db = this.admin.firestore();
        this.messaging = this.admin.messaging();
    }

    async getUserById(userId: string): Promise<User | null> {
        try {
            console.log(`🔍 Fetching user: ${userId}`);
            const userDoc = await this.db.collection('app_users').doc(userId).get();
            if (!userDoc.exists) {
                console.log(`⚠️ User not found: ${userId}`);
                return null;
            }
            
            const userData = userDoc.data();
            console.log(`✅ User found: ${userData?.['name']} (${userData?.['role']})`);
            return normalizeUserData(userData) as User;
        } catch (error) {
            console.error('❌ Error fetching user:', userId, error);
            throw error; // Re-throw para ver el error completo
        }
    }

    async getTruckByDriverId(driverId: string): Promise<Truck | null> {
        const truckSnap = await this.db.collection('trucks')
            .where('id_app_user', '==', driverId)
            .limit(1)
            .get();
        
        return truckSnap.empty ? null : truckSnap.docs[0]?.data() as Truck;
    }

    async getActiveRouteByTruckId(truckId: string): Promise<Route | null> {
        const routeSnap = await this.db.collection('routes')
            .where('id_truck', '==', truckId)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        
        return routeSnap.empty ? null : routeSnap.docs[0]?.data() as Route;
    }

    async getCitizensSubscribedToRoute(routeId: string): Promise<(User & { id: string })[]> {
        if (!routeId) {
            console.log('⚠️ No routeId provided for citizen search');
            return [];
        }
        
        try {
            const usersSnap = await this.db.collection('app_users')
                .where('role', '==', 'citizen')
                .where('selectedRouteId', '==', routeId)
                .get();
        
            return usersSnap.docs.map(doc => ({ 
                id: doc.id, 
                ...normalizeUserData(doc.data())
            })) as (User & { id: string })[];
        } catch (error) {
            console.error('❌ Error fetching citizens for route:', routeId, error);
            return [];
        }
    }

    async getLastNotification(citizenId: string, routeId: string): Promise<Notification | null> {
        const notificationsRef = this.db
            .collection('app_users')
            .doc(citizenId)
            .collection('notifications');

        const recentNotifSnap = await notificationsRef
            .where('type', '==', 'truck_near')
            .where('routeId', '==', routeId)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        return recentNotifSnap.empty ? null : recentNotifSnap.docs[0]?.data() as Notification;
    }

    async sendFCMNotification(fcmToken: string, payload: FCMPayload): Promise<string> {
        try {
            console.log(`🔔 Sending FCM notification to token: ${fcmToken.slice(0, 20)}...`);
            console.log(`🔔 Payload:`, JSON.stringify(payload, null, 2));
            
            // Usar el nuevo método send con el formato correcto
            const message = {
                token: fcmToken,
                notification: payload.notification,
                data: payload.data
            };
            
            console.log(`🔔 Sending message:`, JSON.stringify(message, null, 2));
            const result = await this.messaging.send(message);
            
            console.log(`✅ FCM Message sent successfully:`, result);
            return result;
        } catch (error) {
            console.error('❌ FCM Error:', error);
            throw error;
        }
    }

    async saveNotification(
        citizenId: string, 
        notificationData: Omit<Notification, 'uid' | 'timestamp' | 'read'>
    ): Promise<{ id: string; timestamp: FirebaseFirestore.Timestamp }> {
        const notificationsRef = this.db
            .collection('app_users')
            .doc(citizenId)
            .collection('notifications');
        
        const notificationDoc = notificationsRef.doc();
        const timestamp = this.admin.firestore.Timestamp.now();
        
        await notificationDoc.set({
            uid: notificationDoc.id,
            ...notificationData,
            timestamp,
            read: false,
        });

        return { id: notificationDoc.id, timestamp };
    }
}
