# WhatsApp Gateway Node.js Application

A modular Node.js API application for WhatsApp Gateway with Docker support, comprehensive middleware, and health check endpoints.

## Project Structure

```
src/
├── config/          # Configuration management
├── models/          # Database models
├── services/        # Business logic and services
├── api/
│   └── routes/      # API route handlers
├── jobs/            # Background jobs and cron tasks
├── middlewares/     # Express middlewares
├── utils/           # Utility functions and helpers
└── server.js        # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ or Docker

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** in `.env`

### Running Locally

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

### Docker Setup

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up
   ```

2. **Build Docker image:**
   ```bash
   docker build -t whatsapp-gateway .
   ```

3. **Run Docker container:**
   ```bash
   docker run -p 3000:3000 whatsapp-gateway
   ```

## API Endpoints

### Health Check
- **GET** `/api/health` - Returns application health status including uptime and memory usage

### Root
- **GET** `/` - Returns welcome message and API version

## Project Features

- ✅ Express.js setup with common middlewares
- ✅ CORS and security headers (Helmet)
- ✅ Request logging (Morgan)
- ✅ Error handling middleware
- ✅ Async handler wrapper
- ✅ Configuration management
- ✅ Logger utility with colored output
- ✅ Input validation with Joi
- ✅ Health check endpoint
- ✅ Docker and Docker Compose ready
- ✅ Modular folder structure
- ✅ Background jobs support
- ✅ Graceful shutdown handling

## Environment Variables

```env
NODE_ENV=development          # Environment: development|production|staging
PORT=3000                     # Server port
LOG_LEVEL=debug              # Log level: error|warn|info|debug
CORS_ORIGIN=*                # CORS origin
```

## Scripts

```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
npm test       # Run tests
```

## Development

### Adding New Routes

1. Create a new route file in `src/api/routes/`
2. Import and use in `src/server.js`
3. Example:
   ```javascript
   const myRoutes = require('./api/routes/myroute');
   app.use('/api', myRoutes);
   ```

### Adding Services

1. Create service files in `src/services/`
2. Implement business logic
3. Import and use in route handlers

### Adding Middlewares

1. Create middleware files in `src/middlewares/`
2. Register in `src/server.js` with `app.use()`

## Error Handling

The application includes a global error handler that:
- Catches all errors from async route handlers
- Returns consistent error responses
- Logs errors with context
- Includes stack traces in development mode

## Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-26T10:30:00.000Z",
    "uptime": 120,
    "memory": {
      "heapUsed": 45,
      "heapTotal": 128,
      "external": 2,
      "rss": 150
    }
  },
  "message": "API is healthy"
}
```

## Docker Files

- `Dockerfile` - Multi-stage build for optimized production image
- `docker-compose.yml` - Complete development environment setup
- `.dockerignore` - Files excluded from Docker build
- `.env.example` - Environment variables template

## License

ISC
