import { NotificationPreferences } from '../types';

/**
 * Normaliza las preferencias de notificación para manejar diferentes formatos
 * Algunos usuarios usan camelCase, otros snake_case
 */
export function normalizeNotificationPreferences(data: any): NotificationPreferences {
    const prefs = data.notification_preferences || {};
    
    return {
        daytimeAlerts: prefs.daytimeAlerts ?? prefs.daytime_alerts ?? true,
        nighttimeAlerts: prefs.nighttimeAlerts ?? prefs.nighttime_alerts ?? false,
        daytimeStart: prefs.daytimeStart ?? prefs.daytime_start ?? '06:00',
        daytimeEnd: prefs.daytimeEnd ?? prefs.daytime_end ?? '20:00',
        nighttimeStart: prefs.nighttimeStart ?? prefs.nighttime_start ?? '20:00',
        nighttimeEnd: prefs.nighttimeEnd ?? prefs.nighttime_end ?? '06:00',
    };
}

/**
 * Normaliza los datos del usuario para asegurar consistencia
 */
export function normalizeUserData(userData: any): any {
    return {
        ...userData,
        notification_preferences: normalizeNotificationPreferences(userData),
        phoneNumber: userData.phoneNumber || userData.phone_number || '',
        fcmToken: userData.fcmToken || null,
        selectedRouteId: userData.selectedRouteId || null,
    };
}
