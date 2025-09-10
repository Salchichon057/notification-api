import { NotificationService } from '../src/services/NotificationService';
import { LocationUpdateRequest } from '../src/types';
import { mockAdmin, mockFirestore } from './__mocks__/firebase';

// Import mocks
import './__mocks__/firebase';

describe('NotificationService', () => {
    let notificationService: NotificationService;

    beforeEach(() => {
        notificationService = new NotificationService();
        jest.clearAllMocks();
    });

    describe('processLocationUpdate', () => {
        it('should process location update successfully', async () => {
            const userId = 'test-user-id';
            const locationData: Pick<LocationUpdateRequest, 'location'> = {
                location: {
                    lat: -11.9498,
                    long: -77.0622
                }
            };

            const result = await notificationService.processLocationUpdate(userId, locationData);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Location updated successfully');
        });

        it('should handle invalid coordinates', async () => {
            const userId = 'test-user-id';
            const locationData: Pick<LocationUpdateRequest, 'location'> = {
                location: {
                    lat: 200, // Invalid latitude
                    long: -77.0622
                }
            };

            const result = await notificationService.processLocationUpdate(userId, locationData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid coordinates');
        });

        it('should handle missing user', async () => {
            // Mock user not found
            mockFirestore.collection.mockReturnValueOnce({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        exists: false,
                        data: () => ({
                            name: '',
                            fcmToken: '',
                            isActive: false
                        })
                    }))
                }))
            });

            const userId = 'non-existent-user';
            const locationData: Pick<LocationUpdateRequest, 'location'> = {
                location: {
                    lat: -11.9498,
                    long: -77.0622
                }
            };

            const result = await notificationService.processLocationUpdate(userId, locationData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('User not found');
        });
    });
});
