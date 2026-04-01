## Backend Program Flow

This document explains **end‑to‑end program flow** in the monolith backend: how an incoming request or socket event passes through NestJS, how it uses Postgres / MongoDB / Redis / Stockfish, and how the main chess features are wired together.

It is a **runtime view** of the system, complementary to the per‑module docs.

---

## 1. Application Bootstrap

**File:** `src/main.ts`

- Creates Nest app with `AppModule`:
  - CORS enabled (`origin: true`, `credentials: true`)
  - Logger enabled at all levels
- Registers middleware and globals:
  - `cookie-parser` for HTTP token cookies
  - `LoggingInterceptor` globally
  - Global `ValidationPipe` is currently **commented out** → DTO decorators are not enforced globally.
- In development:
  - Sets up Swagger at `/swagger`
- Listens on `PORT` (default `3000`).

**File:** `src/app.module.ts`

- Loads env from `.env.{NODE_ENV}` via `ConfigModule.forRoot({ isGlobal: true })`.
- Configures **Postgres / TypeORM**:
  - `type: 'postgres'`
  - Host/port/user/password/db from `ENV_VARIABLES.*`
  - Entities: `User`, `UserRelatedData`, `ChessProblem`, `ProblemCategory`, `Theme`, `ProblemTheme`
  - `synchronize: true` (schema auto‑sync for dev)
- Imports feature modules:
  - `UserModule`, `Auth` (via `CommonModule`), `ApiGatewayModule`
  - `GameServiceModule`, `GameEngineModule`
  - `SocketServiceModule`, `NotificationsModule`
  - `CommonModule` also brings in Redis + JWT utilities.

Execution summary:

1. Node starts `bootstrap()` in `main.ts`.
2. Nest creates `AppModule` graph.
3. TypeORM connects to Postgres; Mongoose (via SnapshotModule) connects to Mongo.
4. Redis client created via `RedisProvider`.
5. Game engine / socket / notifications perform their `onModuleInit` work (Lua scripts, Redis subscribers).

---

## 2. Authentication & User Flow (HTTP)

### 2.1. Login / Register / Tokens

**Entry controller:** `src/api-gateway/api-gateway.controller.ts`  
**Service:** `src/api-gateway/api-gateway.service.ts`  
**Auth logic:** `src/auth/auth.service.ts`  
**User logic:** `src/user/user.service.ts`

#### POST `/api/login`

1. **HTTP → Controller**
   - `ApiGatewayController.login()` receives `LoginDto { login, password }`.
2. **Controller → Service**
   - Calls `ApiGatewayService.login(dto)`.
3. **Service → AuthService**
   - `AuthService.login(dto)`:
     - `UserService.getUserByLoginWithPassword(login)` loads user + password hash from Postgres.
     - `bcrypt.compare(dto.password, user.password)` verifies password.
     - Builds JWT payload `{ sub, email, role }` (role from `userRelatedData.role`).
     - Uses `JwtUtils` + `ConfigService` to generate:
       - Access token with `JWT_EXPIRES_IN` + `JWT_SECRET`.
       - Refresh token with `JWT_REFRESH_EXPIRES_IN` + refresh secret.
4. **Response**
   - Controller sets cookies:
     - `accessToken` (httpOnly, `secure: true`, `sameSite: 'strict'`)
     - `refreshToken` (httpOnly, `secure: true`, `sameSite: 'strict'`)
   - Returns **sanitized user** (password removed).

#### POST `/api/register`

1. `ApiGatewayController.register()` → `ApiGatewayService.register()` → `UserService.createUser()`.
2. `UserService.createUser()`:
   - Hashes password with bcrypt.
   - Uses a TypeORM transaction (`DataSource.transaction`) to create:
     - `User` row.
     - Empty `UserRelatedData` (via relation).
   - Handles `23505` unique violation for email/username.
3. Returns created user (no password).

#### POST `/api/refresh`

1. Controller reads `refreshToken` from cookies.
2. `ApiGatewayService.refresh(refreshToken)` → `AuthService.refresh(refreshToken)`:
   - Verifies token with refresh secret.
   - Loads user by `sub`.
   - Regenerates new access + refresh tokens with current role.
3. Controller overwrites cookies with new tokens, returns confirmation JSON.

#### POST `/api/logout`

1. Controller reads `accessToken` from cookies.
2. `ApiGatewayService.logout(accessToken)` → `AuthService.logout(accessToken)`:
   - Verifies token signature and payload.
   - No blacklist is maintained – logout is effectively a client‑side cookie clear + signature check.
3. Controller clears both cookies and returns success JSON.

### 2.2. Protected HTTP Endpoints

**Guard:** `common/libs/guards/auth.guard.ts`

- For HTTP:
  - Reads `req.cookies.accessToken`.
  - Uses `JwtUtils.verifyToken(token)`:
    - On failure → `UnauthorizedException`.
  - Attaches payload to `req.user`.

**Optional role guard:** `common/libs/guards/roles.guard.ts`

- Reads required roles from `@Roles(...)` metadata.
- Checks `req.user.role` against required roles + role hierarchy.

Any controller decorated with `@UseGuards(AuthGuard)` (and optionally `RolesGuard`) will only execute if the token is valid and roles match.

---

## 3. Puzzle / Problem Flow (HTTP + Postgres + Redis + Mongo)

**Controller:** `src/game-service/game-service.controller.ts`  
**Service:** `src/game-service/game-service.service.ts`  
**DB entities:** `ChessProblem`, `ProblemCategory`, `Theme`, `ProblemTheme`  
**Session store:** Redis  
**Snapshot store:** Mongo (`ProblemSnapshot`)

### 3.1. Listing Problems – GET `/game/problems`

1. **Auth**
   - `@UseGuards(AuthGuard)` → token must be valid.
2. **Params**
   - `@Pagination()` → `PaginationDto` (page, limit, sort, etc.).
   - `@Query()` → `GetProblemsQueryDto` (categoryId, difficultyLevel, themeId, isPayable).
   - Both are merged with `mergeDtos` into a single `payload`.
3. **Service query**
   - `GameServiceService.getProblems(payload)`:
     - Builds TypeORM query:
       - `problem.isActive = true`
       - Inner join `problem.category`
       - Optional filters by category, difficulty, payable flag.
       - Optional theme filter via join against `problem_themes` mapping table.
     - Pagination: `skip(payload.skip).take(payload.limit)`.
     - `getManyAndCount()` returns `[problems, total]`.
4. **Response**
   - Controller wraps into:
     - `{ data, total, page, limit }`.

### 3.2. Start Problem – POST `/game/problems/:id/start`

1. **Auth**
   - `@UseGuards(AuthGuard)`, `@UserDecorator()` injects `{ sub, email, role }`.
2. **Service**
   - `GameServiceService.startProblem(id, userMetaData)`:
     - Loads `ChessProblem` by `id` with `isActive = true`.
     - Throws `NotFoundException` if not found.
     - Creates a **problem session** object:
       - `userId`, `problemId`, initial `fen`, `solutionMoves` from DB, empty `userMoves`, `startedAt`.
     - Stores to Redis:
       - Key: `problem_session:user:{userId}:problem:{problemId}`
       - Value: JSON of session.
       - TTL: 1800 seconds (30 minutes).
   - Returns `{ status: 'started' }`.

### 3.3. Make Move in Problem – POST `/game/problems/:id/move`

1. **Auth**
   - `@UseGuards(AuthGuard)`, `@UserDecorator()` for `userId`.
2. **Service**
   - `GameServiceService.makeMove(problemId, userId, dto: ProblemMoveDto)`:
     1. Loads session JSON from Redis by key; throws `NotFoundException` if missing/expired.
     2. Parses to `ProblemSession`.
     3. Builds `Chess` instance from `session.fen`.
     4. Replays all `session.userMoves` on `chess` to reconstruct current position.
     5. Attempts to apply **user move** `dto.move`:
        - If `chess.move(dto.move)` returns `null` → `BadRequestException('Invalid move')`.
     6. Compares applied move with expected solution move at current index:
        - `expectedMove = session.solutionMoves[session.userMoves.length]`.
        - If `from` or `to` don’t match → `BadRequestException('Wrong move')`.
     7. Pushes user move into `session.userMoves`.
     8. If all solution moves completed (problem solved):
        - Builds `ProblemSnapshotDto`:
          - `userId`, `problemId` (strings), `finalFen`, `solvedAt`, `durationMs`, `moves`.
          - `theme` and `level` are currently left empty and would need enrichment if used in analytics.
        - Calls `finishProblemInternal(snapshotDto)` → `SnapshotServiceService.storeProblemSnapshot(snapshotDto)` → Mongo `ProblemSnapshot` document.
        - Deletes Redis session.
        - Returns `{ status: 'solved' }`.
     9. If **not solved**:
        - Writes updated session back to Redis with TTL 1800 seconds.
        - Returns `{ status: 'move accepted' }`.

### 3.4. Finish Problem Explicitly – POST `/game/problems/:id/finsh`

> Note: route path contains a typo: `/finsh`.

1. **Auth**
   - `@UseGuards(AuthGuard)`.
2. **Service**
   - `GameServiceService.finishProblem(problemId, userId)`:
     - Looks up session key.
     - If missing → `NotFoundException('Problem session not found')`.
     - Deletes the session key.
     - Returns `{ status: 'finished' }` without snapshot.

---

## 4. PvE (Player vs Bot) Flow (HTTP + Redis + Stockfish + Mongo)

**Endpoints:** `POST /game/start`, `POST /game/move/:id`  
**Service:** `GameServiceService`  
**Engine:** `GameEngineService` (Stockfish)  
**State store:** Redis `pve:room:{roomId}`  
**Snapshots:** `GameSnapshot` (via `SnapshotServiceService.storeGameResultSnapshot`)

### 4.1. Start Game vs Bot – POST `/game/start`

1. **Auth**
   - `@UseGuards(AuthGuard)`, `@UserDecorator()` for user id.
2. **Service**
   - `GameServiceService.startGameWithBot(dto, user)`:
     - Generates `roomId = uuid()`.
     - Creates `Chess` instance in starting position.
     - Builds `IPvEGameRoom`:
       - `roomId`, `fen`, `turn = 'w'`, color assignment from `dto.color` (`white` or `black`), `level = dto.level`, `allMoves = []`, `createdAt`, `version = 1`.
     - If user selects black, engine plays opening white move immediately; room `fen`/`turn` are updated before storing.
     - Writes it to Redis:
       - Key: `pve:room:{roomId}`
       - TTL: `60 * 60` seconds.
   - Returns `{ roomId, fen, color, level, botMove? }`.

### 4.2. Make Move vs Bot – POST `/game/move/:id`

1. **Auth**
   - `@UseGuards(AuthGuard)`.
2. **Service**
   - `GameServiceService.makeMoveInTheGameWithBot(roomId, move, user)`:
     1. Loads room JSON from `pve:room:{roomId}`; `NotFoundException` if not present.
    2. Confirms user is either room white or room black player.
     3. If `room.isGameOver` true → `BadRequestException('Game already finished')`.
    4. Creates `Chess` from `room.fen` and enforces user turn.
     5. Applies **user move**:
        - `chess.move(move)`; if falsy → `BadRequestException('Invalid move')`.
        - Appends user move to `room.allMoves`.
     6. Checks `chess.isGameOver()`:
        - If true → delegates to `finishPvEGame(room, chess)` (see below).
     7. Otherwise calls Stockfish:
        - `bestMove = await gameEngineService.getBestMove(chess.fen(), room.level)`.
        - Applies `bestMove` on `chess`, appends to `room.allMoves`.
        - If now `chess.isGameOver()` → `finishPvEGame`.
     8. If game continues:
        - Updates `room.fen`, `room.turn`, increments `room.version`.
        - Writes updated room back to Redis with TTL 1 hour.
        - Returns `{ fen, userMove, botMove: bestMove }`.

### 4.3. Finish PvE Game Internals

**Method:** `finishPvEGame(room: IPvEGameRoom, chess: Chess)`

- Sets `room.isGameOver = true`, `room.finishedAt`, final `room.fen`.
- If `chess.isCheckmate()`:
  - `room.isCheckmate = true`
  - `winner` set based on whose turn it is:
    - If it is white to move in a checkmated position, winner is black, and vice versa.
  - `winnerId` is user id or `'bot'`.
- Else marks game as draw.
- Calls `snapshotService.storeGameResultSnapshot(room)`:
  - Internally this chooses PvE path (`storePvEGameResult`) and persists a `GameSnapshot` document.
- Deletes `pve:room:{roomId}` from Redis.
- Returns final `room` object.

---

## 5. PvP Flow (WebSocket + Redis + chess.js + Mongo)

**Gateway:** `src/socket-service/socket-service.gateway.ts`  
**Service:** `src/socket-service/socket-service.service.ts`  
**State store:** Redis (`chess:room:{roomId}`, `chess:user:{userId}:room`, `chess:waiting_queue`)  
**Snapshots:** `GameSnapshot` (`SocketServiceService` → `SnapshotServiceService.storeGameResultSnapshot`)

### 5.1. Socket Connection & Auth

- `SocketServiceGateway` is decorated with `@UseGuards(AuthGuard)`:
  - For WebSocket, `AuthGuard`:
    - Parses `cookie` header from the handshake.
    - Extracts `accessToken`.
    - Verifies token and attaches payload as `client.data.user`.
- Connection lifecycle:
  - `handleConnection(client)` → `socketService.handleReconnect(server, client)`.
  - `handleDisconnect(client)` → `socketService.handleDisconnect(server, client)`.

### 5.2. Matchmaking – FIND_GAME

**Event:** `SOCKET_SUBSCRIBE_MESSAGE.FIND_GAME`

1. Client emits `FIND_GAME`.
2. Gateway method:
   - `findGame(client)` → `SocketServiceService.findGame(server, client, client.data.user.sub)`.
3. Service:
   - Calls `matchOrCreateRoom(userId, client.id)`:
     - Invokes Redis Lua `matchMake` with:
       - Waiting queue key: `chess:waiting_queue`
       - Args: `userId, socketId, roomId, ttl`.
     - Lua script:
       - If user already has `chess:user:{userId}:room`, returns `ALREADY_IN_ROOM`.
       - If waiting slot empty, sets a simple JSON value under `chess:waiting_queue` with TTL.
       - If someone is waiting, removes that entry, builds initial room JSON, writes:
         - `chess:room:{roomId}` (room JSON, TTL)
         - Maps `chess:user:{whiteUserId}:room` and `chess:user:{blackUserId}:room` → room id.
   - Based on result:
     - `'WAIT'` → emits `WAITING_FOR_OPONENT` to the caller.
     - `'MATCH'` → joins both sockets into the room, emits `GAME_STARTED` with initial `fen`, `turn`, `roomId`, `white`, `black`.
     - `'ALREADY_IN_ROOM'` → loads existing room and behaves like `MATCH`.

### 5.3. PvP Move Flow – MAKE_MOVE

**Event:** `SOCKET_SUBSCRIBE_MESSAGE.MAKE_MOVE`

1. Client emits `MAKE_MOVE` with `{ roomId, move: { from, to, promotion? } }`.
2. Gateway:
   - `makeMove(client, payload)` → `SocketServiceService.makeMove(server, client, payload)`.
3. Service flow:
   1. Loads room JSON using `redisClient.findGameRoom(roomKey)` (Lua script).
   2. Guard checks:
      - Room exists; else return silently.
      - `checkDisconnectTimeout(server, room)`:
        - If room has a `disconnected` record older than 30s, marks opponent as winner, persists snapshot, cleans up Redis, emits `GAME_FINISHED` and returns.
      - No active `room.disconnected`.
   3. Identifies `userId` by comparing `client.id` against `room.white.socketId` and `room.black.socketId`.
   4. Determines user color (`white` or `black`) and ensures:
      - It is that color’s turn.
   5. Validates move with `chess.js`:
      - Instantiates `Chess` from `room.fen`.
      - Attempts `chess.move({ from, to })`.
      - If move is illegal, returns without state change.
   6. Updates room:
      - New `fen`.
      - `turn` converted to `'white' | 'black'`.
      - Flags: `isGameOver`, `isCheckmate`, `isDraw`.
      - Ensures `allMoves` array exists, pushes move.
      - If game over:
        - Sets `winner`, `winnerId`, `finishedAt`.
   7. Persists state atomically with Lua `makeMoveAtomic`:
      - Passes expected `room.version`, room JSON, TTL.
      - Script re‑checks version in Redis, increments, saves, returns:
        - Status, new version, `isGameOver` flag.
      - On version conflict, returns error; code treats `'VERSION_CONFLICT'` as “already processed” and exits.
   8. Emits `MOVE_MADE` to room with move.
   9. If Lua indicates `isGameOver`, calls `finishGameInternal(server, room)`:
      - `snapshotService.storeGameResultSnapshot(room)` → PvP snapshot stored in Mongo.
      - Emits `GAME_FINISHED` with `winner`, `winnerId`, and reason (`checkmate` / `draw` / `leav`).
      - Cleans up Redis game room and user‑room mappings.

### 5.4. Disconnect & Reconnect

**Disconnect:** `handleDisconnect`

1. Extracts `userId` from `client.data.user.sub`.
2. Reads `roomId` from `chess:user:{userId}:room`; if none, returns.
3. Reads room JSON via `findGameRoom`.
4. If room finished, returns.
5. Sets `room.disconnected = { userId, at: now }`.
6. Persists with `updateGameRoom` Lua (with TTL 30s), which:
   - Checks version, bumps version, sets new TTL.

There is **no background scheduler**; the “timeout” is enforced lazily:

- On **reconnect** or **next move attempt**, `checkDisconnectTimeout` is called:
  - If grace window (30s) has elapsed and game not finished:
    - Determines winner as the non‑disconnected player.
    - Updates room flags, persists with `updateGameRoom`, calls `finishGameInternal`.

**Reconnect:** `handleReconnect`

1. Extracts `userId` from socket.
2. Reads `roomId` from `chess:user:{userId}:room`; if none, returns.
3. Loads room JSON, runs `checkDisconnectTimeout`:
   - If this finishes the game, exits.
4. Validates user is one of the players.
5. If this user was the `disconnected.userId`, removes `disconnected` flag and updates player’s `socketId` to new connection.
6. Persists with `updateGameRoom` (TTL 1h).
7. Joins socket to `roomId` room.
8. Emits `GAME_RESUMED` to this client with `fen`, `turn`, `allMoves`.

---

## 6. Notification Flow (SSE + Redis pub/sub)

**Controller:** `src/notification-service/notification.controller.ts`  
**Service:** `src/notification-service/notification.service.ts`  
**Redis subscriber:** `src/notification-service/notification-redis.service.ts`

### 6.1. SSE Connection – GET `/notifications/stream`

1. `@UseGuards(AuthGuard)` protects the route, so `req.user` has payload.
2. `@UserDecorator()` provides `userMetaData.sub` (user id).
3. Controller creates an RxJS `Subject` via `notificationsService.addConnection(userId)` and wires it to the SSE response.
4. Starts a 25s heartbeat interval that pushes `{ event: 'ping', data: Date.now() }`.
5. On request `close`, clears heartbeat, removes connection from `NotificationsService`, unsubscribes.

### 6.2. Publishing Notifications via Redis

- `NotificationsRedisSubscriber`:
  - On module init:
    - Calls `redisClient.duplicate()` to create subscriber.
    - Subscribes to `notifications:user` channel.
  - On each message:
    - Parses JSON, expects `userId`, `event`, `data`, optional `id` + `retry`.
    - Forwards as `SseEvent` to `notificationsService.pushToUser(userId, event)`.

Any other service (e.g. Game / Socket / Owner) can publish to this channel to push notifications to online clients.

---

## 7. Snapshot Flow (MongoDB)

**Service:** `src/snapshot-service/snapshot-service.service.ts`  
**Schemas:** `GameSnapshot`, `ProblemSnapshot`

- **Problem snapshots:**
  - Written when a problem is fully solved in `GameServiceService.makeMove`:
    - `storeProblemSnapshot(snapshotDto)` creates and saves `ProblemSnapshot` in Mongo.
- **Game snapshots:**
  - Written when:
    - PvP game is finished in `SocketServiceService.finishGameInternal`.
    - (intended) PvE game is finished in `GameServiceService.finishPvEGame`:
      - Currently, PvE path logs the room but does **not** persist yet (`storePvEGameResult` is a stub).

Snapshots are then available for analytics, progress tracking, and replay features.

---

## 8. Storage & State Summary

- **Postgres / TypeORM**
  - Long‑lived relational data:
    - Users and their related data (roles, plan, stats).
    - Problem catalog, categories, themes, mappings.
- **MongoDB / Mongoose**
  - Historical, append‑only style data:
    - `GameSnapshot` – finished PvP games (PvE pending).
    - `ProblemSnapshot` – solved problems.
- **Redis (ioredis)**
  - Short‑lived, high‑churn state:
    - Problem sessions (`problem_session:...`).
    - PvE rooms (`pve:room:{roomId}`).
    - PvP rooms (`chess:room:{roomId}`).
    - User→room mappings (`chess:user:{userId}:room`).
    - Matchmaking queue (`chess:waiting_queue`).
    - Notification pub/sub channel (`notifications:user`).

This is the current, code‑accurate program flow. If you change a runtime behavior (e.g. add validation pipes, change Redis key formats, or implement PvE snapshots), this document should be updated alongside the relevant module docs.

