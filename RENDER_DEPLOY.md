# Notification API - Configuración para Render

## Configuración de Entornos

Este proyecto está configurado para manejar múltiples entornos:

- **Development**: `.env` (local)
- **Production**: `.env.production` (Render)
- **Test**: `.env.test` (pruebas)

## Configuración en Render

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

### Health Check Path
```
/health
```

### Variables de Entorno Requeridas en Render

Configura estas variables en el panel de Render (Settings > Environment):

```
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=comaslimpio-b3930
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@comaslimpio-b3930.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
[Tu clave privada aquí - usa saltos de línea reales, NO \n]
-----END PRIVATE KEY-----
NOTIFICATION_DISTANCE_THRESHOLD=200
NOTIFICATION_THROTTLE_MINUTES=3
```

### Importante para FIREBASE_PRIVATE_KEY

En Render, la clave privada debe tener **saltos de línea reales**, no `\n`. Copia la clave desde tu archivo `.env.production` pero reemplaza cada `\n` con un salto de línea real.

## Scripts Disponibles

- `npm run dev` - Desarrollo local
- `npm run build` - Compilar TypeScript
- `npm start` - Producción (post-build)
- `npm test` - Ejecutar pruebas

## Endpoints Principales

- `GET /health` - Health check para Render
- `POST /api/update-truck-location` - Actualizar ubicación del camión
- `POST /api/test-notification` - Probar notificaciones

## Estructura de Archivos de Entorno

```
.env                    # Desarrollo local
.env.production        # Producción (no subir a git)
.env.test             # Pruebas
.env.example          # Plantilla
```

El sistema automáticamente carga el archivo `.env.{NODE_ENV}` apropiado.
