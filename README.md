# WhatsApp Gateway (Node.js + Baileys)

Production-focused WhatsApp gateway API built with Express, Baileys, MySQL, Redis, and Bull queueing.

## Overview

This project provides:

- Outbound message queueing and delivery over WhatsApp
- Inbound message capture + webhook forwarding
- Multi-phone connection management (register, status, disconnect)
- Persistent credential storage with encryption
- Docker-based development and production deployment options

## Tech Stack

- Node.js (>= 18)
- Express
- Baileys (`@whiskeysockets/baileys`)
- MySQL + Sequelize
- Redis + Bull queue
- Jest + ESLint + Prettier

## Project Layout

```text
src/
   api/routes/          # health, messages, connections endpoints
   cli/                 # phone registration CLI
   config/              # app/db/redis config + initialization
   jobs/                # Bull queue setup
   middlewares/         # async + global error handlers
   models/              # Sequelize models
   services/            # baileys, message, webhook, rate limit, health
   utils/               # logger, validators, encryption, errors
   server.js            # app bootstrap + graceful shutdown
docs/
   NODEJS_BAILEYS_MIGRATION.md
```

## Quick Start (Local)

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

```bash
cp .env.example .env
```

### 3) Update minimum required `.env` values

At least set these correctly for your environment:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
- `ENCRYPTION_KEY` (64 hex chars / 32 bytes)
- `ENCRYPTION_IV` (32 hex chars / 16 bytes)

### 4) Start the API

```bash
npm run dev
```

or

```bash
npm start
```

Server default URL: `http://localhost:3000`

## Phone Registration

### CLI registration (recommended for first-time linking)

Use either form:

```bash
npm run register:phone -- --phone=94729620813 --method=qr
```

```bash
npm run register:phone --phone=94729620813 --method=qr
```

Supported methods:

- `qr`
- `pairing_code`

Notes:

- Phone format is digits only (10-15 digits).
- The CLI prints QR in terminal when `--method=qr` is used.

### API-based registration

```http
POST /api/connections/register
Content-Type: application/json

{
   "phone": "94729620813",
   "method": "qr"
}
```

Check status:

```http
GET /api/connections/register/94729620813/status
```

## API Endpoints

### General

- `GET /` - API welcome payload
- `GET /api/health` - health status

### Connections

- `GET /api/connections` - list active/known runtime connections
- `POST /api/connections/register` - start phone registration
- `GET /api/connections/register/:phone/status` - registration status
- `POST /api/connections/:phone/disconnect` - disconnect one phone

### Messages

- `POST /api/messages/send` - queue outbound message
- `GET /api/messages/status/:messageId` - fetch delivery status
- `GET /api/messages` - list messages with filters/pagination
- `DELETE /api/messages/:messageId` - delete queued message only
- `POST /api/messages/webhook` - manual inbound processing hook

## Message Payload Example

```http
POST /api/messages/send
Content-Type: application/json

{
   "phone": "94712345678",
   "content": "Your OTP is 123456",
   "messageType": "OTP",
   "priority": "HIGH",
   "lmsContext": "login",
   "lmsUserId": "student_001"
}
```

## NPM Scripts

```bash
# Runtime
npm start
npm run dev

# Tests
npm test
npm run test:ci
npm run test:coverage

# Quality
npm run lint
npm run lint:fix
npm run format
npm run validate

# Database helpers
npm run db:init
npm run db:migrate
npm run db:migrate:undo
npm run db:seed

# Phone registration
npm run register:phone -- --phone=94729620813 --method=qr
```

## Docker

### Development stack

```bash
docker compose up -d
```

Includes:

- app on `3000`
- MySQL on host `3308`
- Redis on host `6381`
- Adminer on `8080`
- phpMyAdmin on `8081`

### Production compose

```bash
docker compose -f docker-compose.prod.yml up -d
```

Set production secrets in shell or `.env` before starting (`DB_PASSWORD`, `REDIS_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `ENCRYPTION_KEY`, `ENCRYPTION_IV`, etc.).

## Environment Variables

Use `.env.example` as the reference template. Main variable groups:

- Node/server: `NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`
- Database: `DB_*`
- Redis: `REDIS_*` (or `REDIS_URL`)
- WhatsApp/Baileys: `WHATSAPP_*`, `BAILEYS_*`
- Messaging: `MESSAGE_*`, `QUEUE_*`
- Webhooks: `WEBHOOK_*`
- Security: `API_KEY`, `JWT_*`, `ENCRYPTION_*`
- Feature toggles: `ENABLE_*`

## Operational Notes

- Server startup initializes DB, Redis, queue workers, then Baileys connections.
- Graceful shutdown handles queue close, socket close, DB close, and Redis close.
- Credential records are encrypted in database storage.

## Additional Documentation

- Deep migration and architecture guide: `docs/NODEJS_BAILEYS_MIGRATION.md`

## License

ISC
