import * as admin from 'firebase-admin';

/**
 * Inicializar Firebase Admin SDK
 */
export function initializeFirebase(): typeof admin {
    if (!admin.apps.length) {
        console.log('🔧 Initializing Firebase Admin SDK...');
        
        const serviceAccount = {
            projectId: process.env['FIREBASE_PROJECT_ID'],
            clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
            privateKey: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n')
        };

        console.log(`🔧 Project ID: ${serviceAccount.projectId}`);
        console.log(`🔧 Client Email: ${serviceAccount.clientEmail}`);
        console.log(`🔧 Private Key: ${serviceAccount.privateKey ? 'Present' : 'Missing'}`);

        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            throw new Error('Missing Firebase configuration. Please check your environment variables.');
        }

        // Validar que las variables de entorno estén presentes
        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            throw new Error('Missing Firebase environment variables. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
        }

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
