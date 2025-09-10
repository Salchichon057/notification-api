// Cargar variables de entorno primero
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { NotificationController } from './controllers/NotificationController'; // Reactivado

const app = express();
const port = Number(process.env['PORT']) || 3000; // Volver a 3000

console.log('🔧 Starting server initialization...');
console.log(`🔧 Using port: ${port}`);
console.log(`🔧 NODE_ENV: ${process.env['NODE_ENV']}`);

// Middleware
console.log('🔧 Setting up CORS...');
app.use(cors({
    origin: '*', // Permitir todos los orígenes para pruebas
    credentials: false // Cambiar a false cuando origin es *
}));
console.log('🔧 Setting up JSON parser...');
app.use(express.json());

// Initialize controller
console.log('🔧 Initializing NotificationController...');
const notificationController = new NotificationController(); // Reactivado

// Routes
console.log('🔧 Setting up routes...');

app.post('/api/update-truck-location', async (req, res) => {
    try {
        await notificationController.updateTruckLocation(req, res);
    } catch (error) {
        console.error('❌ Error in update-truck-location:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post('/api/test-notification', async (req, res) => {
    try {
        await notificationController.testNotification(req, res);
    } catch (error) {
        console.error('❌ Error in test-notification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Endpoint para probar FCM directo (solo para testing)
app.post('/api/test-fcm-direct', async (req, res) => {
    try {
        // Usar el ID de Eva por defecto si no se proporciona userId
        const userId = req.body.userId || 'bT0KKtWfxpdgtFmTYcaF1M5RjHM2';
        
        console.log('🧪 Testing FCM with user:', userId);

        // Crear FirebaseService directamente para testing
        const { FirebaseService } = await import('./services/FirebaseService');
        const firebaseService = new FirebaseService();
        
        const user = await firebaseService.getUserById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (!user.fcmToken) {
            res.status(400).json({ success: false, message: 'User has no FCM token' });
            return;
        }

        console.log(`🔔 Sending FCM to ${user.name} (${user.role}) - Token: ${user.fcmToken.slice(0, 20)}...`);

        try {
            // Usar el nuevo método de envío de FCM
            const messaging = firebaseService['messaging'];
            const message = {
                token: user.fcmToken,
                notification: {
                    title: '🚛 ComasLimpio - Prueba',
                    body: 'Mensaje de prueba desde el API de notificaciones'
                },
                data: {
                    type: 'test',
                    message: 'Prueba de notificación'
                }
            };

            console.log(`🔔 Sending message:`, JSON.stringify(message, null, 2));
            const result = await messaging.send(message);
            console.log(`✅ FCM Message sent successfully:`, result);
            
            res.json({
                success: true,
                message: 'FCM notification sent successfully',
                user: { name: user.name, role: user.role },
                messageId: result
            });

        } catch (fcmError: any) {
            console.error('❌ FCM Send Error:', fcmError);
            
            // Intentar con el método legacy como fallback
            console.log('🔄 Trying legacy sendToDevice method...');
            const legacyPayload = {
                notification: {
                    title: '🚛 ComasLimpio - Prueba Legacy',
                    body: 'Mensaje de prueba método legacy'
                },
                data: {
                    type: 'test_legacy',
                    message: 'Prueba legacy'
                }
            };

            const legacyResult = await firebaseService.sendFCMNotification(user.fcmToken, legacyPayload);
            
            res.json({
                success: true,
                message: 'FCM notification sent via legacy method',
                user: { name: user.name, role: user.role },
                fcmResult: legacyResult
            });
        }

    } catch (error) {
        console.error('❌ Error in test-fcm-direct:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.get('/health', async (req, res) => {
    try {
        await notificationController.getHealth(req, res);
    } catch (error) {
        console.error('❌ Error in health check:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Legacy routes for backward compatibility
app.post('/update-location', async (req, res) => {
    try {
        await notificationController.updateTruckLocation(req, res);
    } catch (error) {
        console.error('❌ Error in legacy update-location:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post('/test-notification', async (req, res) => {
    try {
        await notificationController.testNotification(req, res);
    } catch (error) {
        console.error('❌ Error in legacy test-notification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Endpoint para prueba específica de Firebase Console
app.post('/api/test-firebase-console', async (req, res) => {
    try {
        console.log('🔥 Testing Firebase Console notification visibility...');

        // Crear FirebaseService directamente para testing
        const { FirebaseService } = await import('./services/FirebaseService');
        const firebaseService = new FirebaseService();
        
        const userId = 'bT0KKtWfxpdgtFmTYcaF1M5RjHM2'; // Eva
        const user = await firebaseService.getUserById(userId);
        
        if (!user || !user.fcmToken) {
            res.status(400).json({ success: false, message: 'User not found or no FCM token' });
            return;
        }

        // Crear mensaje con formato que debería aparecer en Firebase Console
        const messaging = firebaseService['messaging'];
        const message = {
            token: user.fcmToken,
            notification: {
                title: 'PRUEBA ComasLimpio',
                body: 'Notificación de prueba para Firebase Console Dashboard'
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                sound: 'default',
                type: 'test_console',
                timestamp: new Date().toISOString(),
                route: 'notification_test'
            },
            android: {
                notification: {
                    channelId: 'comaslimpio_notifications',
                    priority: 'high' as const,
                    defaultSound: true,
                    defaultVibrateTimings: true
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: 'PRUEBA ComasLimpio',
                            body: 'Notificación de prueba para Firebase Console Dashboard'
                        },
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        console.log('🔔 Sending enhanced message for Firebase Console:', JSON.stringify(message, null, 2));
        
        const result = await messaging.send(message);
        console.log('✅ Enhanced FCM Message sent successfully:', result);
        
        res.json({
            success: true,
            message: 'Enhanced FCM notification sent for Firebase Console',
            user: { name: user.name, role: user.role },
            messageId: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in Firebase Console test:', error);
        res.status(500).json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Endpoint temporal para actualizar la ruta de un usuario (solo para testing)
app.post('/api/update-user-route', async (req, res) => {
    try {
        const { userId, routeId } = req.body;
        
        if (!userId || !routeId) {
            res.status(400).json({ success: false, message: 'userId and routeId are required' });
            return;
        }
        
        console.log('🔄 Updating user route:', userId, 'to route:', routeId);
        
        // Create FirebaseService instance
        const { FirebaseService } = await import('./services/FirebaseService');
        const firebaseService = new FirebaseService();
        
        // Update user's selectedRouteId in Firestore
        await firebaseService['db'].collection('users').doc(userId).update({
            selectedRouteId: routeId
        });
        
        console.log('✅ User route updated successfully');
        
        res.json({
            success: true,
            message: 'User route updated successfully',
            userId,
            newRouteId: routeId
        });
    } catch (error) {
        console.error('❌ Error updating user route:', error);
        res.status(500).json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Debug endpoint to check user and truck data
app.post('/api/debug-user', async (req, res) => {
    try {
        const { userId } = req.body;
        
        console.log('🔍 Debugging user:', userId);
        
        // Create FirebaseService instance for debugging
        const { FirebaseService } = await import('./services/FirebaseService');
        const firebaseService = new FirebaseService();
        
        // Get user data
        const userData = await firebaseService.getUserById(userId);
        console.log('👤 User data:', JSON.stringify(userData, null, 2));
        
        if (userData && userData.role === 'truck_driver') {
            // Get truck data
            const truckData = await firebaseService.getTruckByDriverId(userId);
            console.log('🚛 Truck data:', JSON.stringify(truckData, null, 2));
            
            if (truckData) {
                console.log('🔑 Truck ID field (idTruck):', truckData.id_truck);
                console.log('🔑 Truck ID field (id_truck):', (truckData as any).id_truck);
                console.log('🔑 Truck ID field (id):', (truckData as any).id);
            }
        }
        
        res.json({
            success: true,
            userData,
            truckData: userData?.role === 'truck_driver' ? await firebaseService.getTruckByDriverId(userId) : null
        });
    } catch (error) {
        console.error('Error in debug user:', error);
        res.status(500).json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
console.log('About to start server...');
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Notification API running on port ${port}`);
    console.log(`📍 Health check: http://localhost:${port}/health`);
    console.log(`🔔 Update endpoint: http://localhost:${port}/api/update-truck-location`);
    console.log(`🌐 Server listening on all interfaces (0.0.0.0:${port})`);
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
});

export default app;
