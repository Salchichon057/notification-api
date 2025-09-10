const NotificationService = require('../../src/services/NotificationService');

// Mock Firebase Service
jest.mock('../../src/services/FirebaseService', () => {
    return jest.fn().mockImplementation(() => ({
        getUserById: jest.fn(),
        getTruckByDriverId: jest.fn(),
        getActiveRouteByTruckId: jest.fn(),
        getCitizensSubscribedToRoute: jest.fn(),
        getLastNotification: jest.fn(),
        sendFCMNotification: jest.fn(),
        saveNotification: jest.fn()
    }));
});

describe('NotificationService', () => {
    let notificationService;
    let mockFirebaseService;

    beforeEach(() => {
        notificationService = new NotificationService();
        mockFirebaseService = notificationService.firebaseService;

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('validateInput', () => {
        test('should validate correct input', () => {
            const result = notificationService.validateInput('user123', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.isValid).toBe(true);
        });

        test('should reject missing userId', () => {
            const result = notificationService.validateInput('', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('UserId is required');
        });

        test('should reject missing location data', () => {
            const result = notificationService.validateInput('user123', {});

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Location data is required');
        });

        test('should reject invalid coordinates', () => {
            const result = notificationService.validateInput('user123', {
                location: { lat: 91, long: -77.042793 }
            });

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Invalid coordinates');
        });
    });

    describe('processLocationUpdate', () => {
        const mockUserData = {
            uid: 'driver123',
            role: 'truck_driver',
            location: { lat: -12.046374, long: -77.042793 }
        };

        const mockTruckData = {
            idTruck: 'truck123'
        };

        const mockRouteData = {
            uid: 'route123'
        };

        beforeEach(() => {
            mockFirebaseService.getUserById.mockResolvedValue(mockUserData);
            mockFirebaseService.getTruckByDriverId.mockResolvedValue(mockTruckData);
            mockFirebaseService.getActiveRouteByTruckId.mockResolvedValue(mockRouteData);
        });

        test('should process valid location update successfully', async () => {
            mockFirebaseService.getCitizensSubscribedToRoute.mockResolvedValue([]);

            const result = await notificationService.processLocationUpdate('user123', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.success).toBe(true);
            expect(result.routeId).toBe('route123');
            expect(result.truckId).toBe('truck123');
        });

        test('should handle user not found', async () => {
            mockFirebaseService.getUserById.mockResolvedValue(null);

            const result = await notificationService.processLocationUpdate('user123', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('User not found');
        });

        test('should handle non-truck driver user', async () => {
            mockFirebaseService.getUserById.mockResolvedValue({
                ...mockUserData,
                role: 'citizen'
            });

            const result = await notificationService.processLocationUpdate('user123', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Not a truck driver or no location');
        });

        test('should handle no truck found', async () => {
            mockFirebaseService.getTruckByDriverId.mockResolvedValue(null);

            const result = await notificationService.processLocationUpdate('user123', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('No truck found');
        });

        test('should handle no active route', async () => {
            mockFirebaseService.getActiveRouteByTruckId.mockResolvedValue(null);

            const result = await notificationService.processLocationUpdate('user123', {
                location: { lat: -12.046374, long: -77.042793 }
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('No active route found');
        });
    });

    describe('checkThrottling', () => {
        test('should allow notification when no previous notification exists', async () => {
            mockFirebaseService.getLastNotification.mockResolvedValue(null);

            const result = await notificationService.checkThrottling('citizen123', 'route123');
            expect(result).toBe(true);
        });

        test('should allow notification when throttle time has passed', async () => {
            const oldTimestamp = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
            mockFirebaseService.getLastNotification.mockResolvedValue({
                timestamp: { toDate: () => oldTimestamp }
            });

            const result = await notificationService.checkThrottling('citizen123', 'route123');
            expect(result).toBe(true);
        });

        test('should block notification when within throttle time', async () => {
            const recentTimestamp = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
            mockFirebaseService.getLastNotification.mockResolvedValue({
                timestamp: { toDate: () => recentTimestamp }
            });

            const result = await notificationService.checkThrottling('citizen123', 'route123');
            expect(result).toBe(false);
        });
    });

    describe('processCitizenNotification', () => {
        const mockCitizen = {
            id: 'citizen123',
            location: { lat: -12.046374, long: -77.042793 },
            fcmToken: 'mock-fcm-token'
        };

        const mockTruckLocation = { lat: -12.046500, long: -77.042793 }; // ~150m away

        test('should send notification when citizen is within distance and not throttled', async () => {
            mockFirebaseService.getLastNotification.mockResolvedValue(null);
            mockFirebaseService.sendFCMNotification.mockResolvedValue({ success: true });
            mockFirebaseService.saveNotification.mockResolvedValue({ id: 'notif123' });

            const result = await notificationService.processCitizenNotification(
                mockCitizen,
                mockTruckLocation,
                'route123',
                'truck123'
            );

            expect(result.sent).toBe(true);
            expect(result.citizenId).toBe('citizen123');
            expect(mockFirebaseService.sendFCMNotification).toHaveBeenCalled();
            expect(mockFirebaseService.saveNotification).toHaveBeenCalled();
        });

        test('should skip notification when citizen has no location', async () => {
            const citizenWithoutLocation = { ...mockCitizen, location: null };

            const result = await notificationService.processCitizenNotification(
                citizenWithoutLocation,
                mockTruckLocation,
                'route123',
                'truck123'
            );

            expect(result.sent).toBe(false);
            expect(result.reason).toBe('No location');
        });

        test('should skip notification when citizen has no FCM token', async () => {
            const citizenWithoutToken = { ...mockCitizen, fcmToken: null };

            const result = await notificationService.processCitizenNotification(
                citizenWithoutToken,
                mockTruckLocation,
                'route123',
                'truck123'
            );

            expect(result.sent).toBe(false);
            expect(result.reason).toBe('No FCM token');
        });

        test('should skip notification when citizen is too far', async () => {
            const farTruckLocation = { lat: -12.1, long: -77.1 }; // Very far away

            const result = await notificationService.processCitizenNotification(
                mockCitizen,
                farTruckLocation,
                'route123',
                'truck123'
            );

            expect(result.sent).toBe(false);
            expect(result.reason).toBe('Too far');
        });

        test('should skip notification when throttled', async () => {
            const recentTimestamp = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
            mockFirebaseService.getLastNotification.mockResolvedValue({
                timestamp: { toDate: () => recentTimestamp }
            });

            const result = await notificationService.processCitizenNotification(
                mockCitizen,
                mockTruckLocation,
                'route123',
                'truck123'
            );

            expect(result.sent).toBe(false);
            expect(result.reason).toBe('Throttled');
        });
    });
});
