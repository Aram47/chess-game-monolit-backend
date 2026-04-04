# Chess Game Monolith Backend

NestJS modular monolith for the chess platform: REST API, real-time play (Socket.IO), puzzles and PvE, Stockfish-backed analysis, JWT and Google OAuth auth, and notifications (Redis pub/sub + SSE).

## Stack

| Area | Technology |
|------|------------|
| Runtime | Node.js, TypeScript, NestJS 10 |
| Relational DB | PostgreSQL 16, TypeORM |
| Document DB | MongoDB, Mongoose |
| Cache / pub-sub | Redis (ioredis) |
| Real-time | Socket.IO |
| Chess rules | chess.js |
| Engine | Stockfish (built in Docker image; local dev needs `stockfish` on `PATH`) |
| API docs | Swagger UI (development only) |

## Prerequisites

- **Node.js** 18+ recommended (aligns with NestJS 10)
- **npm**
- For local runs without Docker: **PostgreSQL**, **MongoDB**, **Redis**, and **Stockfish** available to the process

## Quick start with Docker

The compose file starts PostgreSQL, MongoDB, Redis, and the Nest app. The app loads `.env.development` (see [Environment](#environment)).

```bash
cp .env.example .env.development
# Edit .env.development: set secrets, OAuth (if used), and ensure DB/redis/mongo hosts match compose service names when running inside Docker (see existing .env.development template).

npm install
npm run docker:up
```

- HTTP API: `http://localhost:3000` (or the `PORT` you set)
- Swagger (only when `NODE_ENV=development`): `http://localhost:3000/swagger`
- OpenAPI JSON: `http://localhost:3000/swagger/json`

Helper scripts (see `package.json`): `docker:down`, `docker:logs`, `docker:wait`, `docker:test`, `docker:setup`.

## Local development (without Docker)

1. Start PostgreSQL, MongoDB, and Redis locally.
2. Install Stockfish and ensure the binary is on `PATH` (engine features depend on it).
3. Copy and fill env files:

   ```bash
   cp .env.example .env.development
   ```

   Use `localhost` (and your local ports) for `POSTGRES_HOST`, `MONGO_HOST`, `REDIS_HOST`.

4. Run:

   ```bash
   npm install
   npm run start:dev
   ```

Production build:

```bash
npm run build
npm run start:prod
```

## Environment

Configuration is loaded from **`.env.${NODE_ENV}`** (for example `.env.development` when `NODE_ENV=development`). See `.env.example` for the full variable list.

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` enables Swagger; affects env file selection |
| `FRONTEND_URL` | CORS / OAuth redirect context |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Access token |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | Refresh token |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth |
| `REDIS_HOST`, `REDIS_PORT` | Redis |
| `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB_NAME` | MongoDB |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL (TypeORM) |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Also used by the Postgres Docker image when using `docker-compose` |

**Security:** Never commit real secrets. Replace placeholder values in `.env.development` before sharing or deploying.

## Project layout

- `src/` — NestJS application modules (API gateway, auth, user, game, game engine, sockets, notifications, owner, snapshot, game analysis).
- `common/` — Shared entities, constants, utilities, guards, and cross-cutting code.
- `docs/` — Module-level architecture and API notes ([index](./docs/README.md)).
- `docker-compose.yml` — Local stack for DBs, Redis, and the app.
- `Dockerfile` — Node image with Stockfish 15.1 built from source.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with watch (`NODE_ENV=development`) |
| `npm run start:debug` | Dev + debugger |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app (`NODE_ENV=production`) |
| `npm run lint` | ESLint |
| `npm test` | Jest (default) |
| `npm run test:unit` | Unit tests |
| `npm run test:int` | Integration tests |
| `npm run test:e2e` | E2E tests |

## API and protocols

- **REST:** Documented in Swagger at `/swagger` when `NODE_ENV=development`. Treat Swagger as the contract for paths, methods, and DTOs.
- **WebSocket:** Socket.IO — see [docs/09-socket-service.md](./docs/09-socket-service.md).
- **Notifications:** SSE and Redis — see [docs/07-notification-service.md](./docs/07-notification-service.md).

Further reading: [docs/README.md](./docs/README.md) (module index, security notes, troubleshooting).

## License

See `package.json` (`private`, `UNLICENSED` unless you change it).
