const { getDistanceFromLatLonInMeters, validateCoordinates } = require('../../src/utils/geolocation');

describe('Geolocation Utils', () => {
    describe('getDistanceFromLatLonInMeters', () => {
        test('should calculate distance correctly between two points', () => {
            // Lima Centro a Miraflores (approximately 10km)
            const lat1 = -12.046374;
            const lon1 = -77.042793;
            const lat2 = -12.121889;
            const lon2 = -77.029670;

            const distance = getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2);

            // Should be around 8-10km
            expect(distance).toBeGreaterThan(8000);
            expect(distance).toBeLessThan(12000);
        });

        test('should return 0 for same coordinates', () => {
            const lat = -12.046374;
            const lon = -77.042793;

            const distance = getDistanceFromLatLonInMeters(lat, lon, lat, lon);
            expect(distance).toBe(0);
        });

        test('should calculate short distances accurately', () => {
            // Two points very close to each other (~200m)
            const lat1 = -12.046374;
            const lon1 = -77.042793;
            const lat2 = -12.048;
            const lon2 = -77.042793;

            const distance = getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2);

            // Should be around 180-220 meters
            expect(distance).toBeGreaterThan(150);
            expect(distance).toBeLessThan(250);
        });
    });

    describe('validateCoordinates', () => {
        test('should validate correct coordinates', () => {
            expect(validateCoordinates(-12.046374, -77.042793)).toBe(true);
            expect(validateCoordinates(0, 0)).toBe(true);
            expect(validateCoordinates(90, 180)).toBe(true);
            expect(validateCoordinates(-90, -180)).toBe(true);
        });

        test('should reject invalid latitudes', () => {
            expect(validateCoordinates(91, 0)).toBe(false);
            expect(validateCoordinates(-91, 0)).toBe(false);
            expect(validateCoordinates(100, 0)).toBe(false);
        });

        test('should reject invalid longitudes', () => {
            expect(validateCoordinates(0, 181)).toBe(false);
            expect(validateCoordinates(0, -181)).toBe(false);
            expect(validateCoordinates(0, 200)).toBe(false);
        });
    });
});
