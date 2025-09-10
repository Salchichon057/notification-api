// Setup global test environment
import 'jest';

// Set test environment variables
process.env['FIREBASE_PROJECT_ID'] = 'test-project';
process.env['FIREBASE_CLIENT_EMAIL'] = 'test@test-project.iam.gserviceaccount.com';
process.env['FIREBASE_PRIVATE_KEY'] = 'test-private-key';
process.env['NOTIFICATION_DISTANCE_THRESHOLD'] = '200';
process.env['NOTIFICATION_THROTTLE_MINUTES'] = '3';
