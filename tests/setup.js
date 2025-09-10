// Test environment setup
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
process.env.NOTIFICATION_DISTANCE_THRESHOLD = '200';
process.env.NOTIFICATION_THROTTLE_MINUTES = '3';

// Mock Firebase Admin globally
jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn()
    },
    firestore: jest.fn(() => ({
        collection: jest.fn()
    })),
    messaging: jest.fn(() => ({
        sendToDevice: jest.fn()
    }))
}));

// Global test helpers
global.createMockUser = (overrides = {}) => ({
    uid: 'test-user-id',
    role: 'truck_driver',
    location: { lat: -12.046374, long: -77.042793 },
    ...overrides
});

global.createMockCitizen = (overrides = {}) => ({
    id: 'citizen-123',
    role: 'citizen',
    location: { lat: -12.046500, long: -77.042793 },
    fcmToken: 'mock-fcm-token-123',
    selectedRouteId: 'route-123',
    ...overrides
});

global.createMockTruck = (overrides = {}) => ({
    idTruck: 'truck-123',
    id_app_user: 'driver-123',
    ...overrides
});

global.createMockRoute = (overrides = {}) => ({
    uid: 'route-123',
    id_truck: 'truck-123',
    status: 'active',
    ...overrides
});
