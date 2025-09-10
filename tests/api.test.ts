import request from 'supertest';
import { mockAdmin } from './__mocks__/firebase';

// Import mocks
import './__mocks__/firebase';

// Import app after mocks are set up
import app from '../src/index';

describe('Notification API Integration', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('service', 'Notification API');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('POST /update-location', () => {
        it('should require userId and location', async () => {
            const response = await request(app)
                .post('/update-location')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('userId and location are required');
        });

        it('should handle valid location update', async () => {
            const locationData = {
                userId: 'test-user-id',
                location: {
                    lat: -11.9498,
                    long: -77.0622
                }
            };

            const response = await request(app)
                .post('/update-location')
                .send(locationData)
                .expect(200);

            expect(response.body).toHaveProperty('success');
        });
    });

    describe('POST /test-notification', () => {
        it('should require userId', async () => {
            const response = await request(app)
                .post('/test-notification')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('userId is required');
        });

        it('should handle valid test notification', async () => {
            const testData = {
                userId: 'test-user-id'
            };

            const response = await request(app)
                .post('/test-notification')
                .send(testData)
                .expect(200);

            expect(response.body).toHaveProperty('success');
        });
    });
});
