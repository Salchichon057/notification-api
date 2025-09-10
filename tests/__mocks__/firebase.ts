import { jest } from '@jest/globals';

// Mock completo de Firebase Admin SDK
const mockFirestore = {
    collection: jest.fn(() => ({
        doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
                exists: true,
                data: () => ({
                    name: 'Test User',
                    fcmToken: 'test-fcm-token',
                    isActive: true
                })
            }))
        }))
    }))
};

const mockMessaging = {
    send: jest.fn(() => Promise.resolve('test-message-id'))
};

const mockAdmin = {
    firestore: jest.fn(() => mockFirestore),
    messaging: jest.fn(() => mockMessaging)
};

// Mock del módulo firebase-admin
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn()
    },
    firestore: jest.fn(() => mockFirestore),
    messaging: jest.fn(() => mockMessaging)
}));

// Mock de la función de inicialización
jest.mock('../src/utils/firebase.ts', () => ({
    initializeFirebase: jest.fn(() => mockAdmin)
}));

export { mockAdmin, mockFirestore, mockMessaging };
