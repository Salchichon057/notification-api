import { validateCoordinates, getDistanceFromLatLonInMeters } from '../src/utils/geolocation';

describe('NotificationService Basic Tests', () => {
    describe('Geolocation validation', () => {
        it('should validate coordinates for real users', () => {
            // Coordenadas reales de Lima, Peru
            const limaCoords = { lat: -11.926050182376606, long: -77.04612622266666 };
            
            const isValid = validateCoordinates(limaCoords.lat, limaCoords.long);
            
            expect(isValid).toBe(true);
        });

        it('should calculate distance correctly', () => {
            // Coordenadas muy cercanas para simular proximidad
            const coord1 = { lat: -11.926050182376606, long: -77.04612622266666 };
            const coord2 = { lat: -11.926150182376606, long: -77.04622622266666 };
            
            const distance = getDistanceFromLatLonInMeters(
                coord1.lat, coord1.long,
                coord2.lat, coord2.long
            );
            
            // La distancia debería ser menor a 200m (umbral de proximidad)
            expect(distance).toBeLessThan(200);
        });
    });
});
