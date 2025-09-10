import { getDistanceFromLatLonInMeters, validateCoordinates } from '../src/utils/geolocation';

describe('Geolocation Utils', () => {
    describe('validateCoordinates', () => {
        it('should validate correct coordinates', () => {
            const result = validateCoordinates(-11.9498, -77.0622);
            expect(result).toBe(true);
        });

        it('should reject invalid latitude', () => {
            const result = validateCoordinates(200, -77.0622);
            expect(result).toBe(false);
        });

        it('should reject invalid longitude', () => {
            const result = validateCoordinates(-11.9498, 200);
            expect(result).toBe(false);
        });
    });

    describe('getDistanceFromLatLonInMeters', () => {
        it('should calculate distance correctly', () => {
            const lat1 = -11.9498;
            const lon1 = -77.0622;
            const lat2 = -11.9500;
            const lon2 = -77.0620;

            const distance = getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2);
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(50); // Should be very close distance
        });

        it('should return 0 for same coordinates', () => {
            const lat = -11.9498;
            const lon = -77.0622;

            const distance = getDistanceFromLatLonInMeters(lat, lon, lat, lon);
            expect(distance).toBe(0);
        });
    });
});
