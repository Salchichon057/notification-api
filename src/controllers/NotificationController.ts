import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { 
    LocationUpdateRequest,
    TestNotificationRequest,
    HealthResponse,
    ErrorResponse 
} from '../types';

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    async updateTruckLocation(req: Request, res: Response): Promise<void> {
        try {
            const { userId, location }: LocationUpdateRequest = req.body;

            if (!userId || !location) {
                res.status(400).json({
                    success: false,
                    message: 'userId and location are required'
                } as ErrorResponse);
                return;
            }

            const result = await this.notificationService.processLocationUpdate(userId, { location });

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }

        } catch (error) {
            console.error('Error in updateTruckLocation:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            } as ErrorResponse);
        }
    }

    async testNotification(req: Request, res: Response): Promise<void> {
        try {
            const { userId }: TestNotificationRequest = req.body;

            if (!userId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'userId is required' 
                } as ErrorResponse);
                return;
            }

            // Simular datos de ubicación para testing
            const testLocationData = {
                location: {
                    lat: -11.9498,
                    long: -77.0622
                }
            };

            const result = await this.notificationService.processLocationUpdate(userId, testLocationData);
            res.json(result);

        } catch (error) {
            console.error('Error in testNotification:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            } as ErrorResponse);
        }
    }

    getHealth(_req: Request, res: Response): void {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'Notification API',
            version: '1.0.0'
        } as HealthResponse);
    }
}
