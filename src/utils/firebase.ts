import * as admin from 'firebase-admin';
import { config } from '../config';

/**
 * Inicializar Firebase Admin SDK
 */
export function initializeFirebase(): typeof admin {
    if (!admin.apps.length) {
        console.log('🔧 Initializing Firebase Admin SDK...');
        
        const serviceAccount = {
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey
        };

        console.log(`🔧 Project ID: ${serviceAccount.projectId}`);
        console.log(`🔧 Client Email: ${serviceAccount.clientEmail}`);
        console.log(`🔧 Private Key: ${serviceAccount.privateKey ? 'Present' : 'Missing'}`);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            projectId: serviceAccount.projectId,
            databaseURL: `https://${serviceAccount.projectId}-default-rtdb.firebaseio.com`
        });

        console.log('✅ Firebase Admin SDK initialized successfully');

        // Configurar Firestore para ignorar valores undefined
        const firestore = admin.firestore();
        firestore.settings({
            ignoreUndefinedProperties: true
        });
        
        console.log('✅ Firestore settings configured');
    } else {
        console.log('🔧 Firebase Admin SDK already initialized');
    }
    return admin;
}
