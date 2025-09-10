// Core domain types
export interface Location {
    lat: number;
    long: number;
}

export interface User {
    uid: string;
    name: string;
    email: string;
    role: 'truck_driver' | 'citizen' | 'admin';
    location?: Location;
    fcmToken?: string;
    selectedRouteId?: string;
    status: 'active' | 'inactive';
    created_at: FirebaseFirestore.Timestamp;
    notification_preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
    daytimeAlerts: boolean;
    nighttimeAlerts: boolean;
    daytimeStart: string;
    daytimeEnd: string;
    nighttimeStart: string;
    nighttimeEnd: string;
}

export interface Truck {
    id_truck: string;  // Cambiado para que coincida con la base de datos
    id_app_user: string;
    status: 'active' | 'inactive' | 'maintenance';
    created_at: FirebaseFirestore.Timestamp;
    // Campos adicionales que vimos en los datos reales
    color?: string;
    engine_number?: string;
    vehicle_type?: string;
    model?: string;
    serial_number?: string;
    year_of_manufacture?: number;
    brand?: string;
}

export interface Route {
    uid: string;
    id_truck: string;
    status: 'active' | 'inactive' | 'completed';
    name?: string;
    created_at: FirebaseFirestore.Timestamp;
}

export interface Notification {
    uid: string;
    type: 'truck_near' | 'route_update' | 'system';
    routeId: string;
    message: string;
    timestamp: FirebaseFirestore.Timestamp;
    read: boolean;
    data?: Record<string, string>;
}

// API Request/Response types
export interface LocationUpdateRequest {
    userId: string;
    location: Location;
}

export interface LocationUpdateResponse {
    success: boolean;
    message: string;
    notificationsSent?: number;
    totalCitizens?: number;
    routeId?: string;
    truckId?: string;
    notifications?: NotificationResult[];
}

export interface NotificationResult {
    citizenId: string;
    sent: boolean;
    reason?: string;
    distance?: string;
    fcmToken?: string;
    error?: string;
}

export interface TestNotificationRequest {
    userId: string;
}

export interface HealthResponse {
    status: 'OK' | 'ERROR';
    timestamp: string;
    service: string;
    version: string;
}

export interface ErrorResponse {
    success: false;
    message: string;
    error?: string;
}

// Service types
export interface ValidationResult {
    isValid: boolean;
    message?: string;
}

export interface ProximityNotificationResult {
    totalCitizens: number;
    notificationsSent: number;
    notifications: NotificationResult[];
}

// FCM types
export interface FCMPayload {
    notification: {
        title: string;
        body: string;
    };
    data: Record<string, string>;
}

// Firebase types extensions
declare global {
    namespace FirebaseFirestore {
        interface Timestamp {
            toDate(): Date;
        }
    }
}
