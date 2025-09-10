import dotenv from 'dotenv';
import path from 'path';

/**
 * Configuración de entornos para la aplicación
 */
class Config {
    public readonly nodeEnv: string;
    public readonly port: number;
    public readonly firebase: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    public readonly notification: {
        distanceThreshold: number;
        throttleMinutes: number;
    };

    constructor() {
        // Cargar el archivo .env apropiado basado en NODE_ENV
        this.loadEnvironmentVariables();

        // Validar variables requeridas
        this.validateRequiredVariables();

        // Configurar propiedades
        this.nodeEnv = process.env['NODE_ENV'] || 'development';
        this.port = Number(process.env['PORT']) || 3000;

        this.firebase = {
            projectId: process.env['FIREBASE_PROJECT_ID']!,
            clientEmail: process.env['FIREBASE_CLIENT_EMAIL']!,
            privateKey: process.env['FIREBASE_PRIVATE_KEY']!.replace(/\\n/g, '\n')
        };

        this.notification = {
            distanceThreshold: Number(process.env['NOTIFICATION_DISTANCE_THRESHOLD']) || 200,
            throttleMinutes: Number(process.env['NOTIFICATION_THROTTLE_MINUTES']) || 3
        };
    }

    private loadEnvironmentVariables(): void {
        const env = process.env['NODE_ENV'] || 'development';
        
        // Cargar archivo base .env
        dotenv.config();
        
        // Cargar archivo específico del entorno si existe
        const envFile = `.env.${env}`;
        const envPath = path.resolve(process.cwd(), envFile);
        
        try {
            dotenv.config({ path: envPath, override: true });
            console.log(`🔧 Loaded environment config from: ${envFile}`);
        } catch (error) {
            console.log(`🔧 No specific environment file found (${envFile}), using default .env`);
        }
    }

    private validateRequiredVariables(): void {
        const required = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY'
        ];

        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    public isDevelopment(): boolean {
        return this.nodeEnv === 'development';
    }

    public isProduction(): boolean {
        return this.nodeEnv === 'production';
    }

    public isTest(): boolean {
        return this.nodeEnv === 'test';
    }
}

// Exportar instancia singleton
export const config = new Config();
