# Socket Service Module

## Overview

The Socket Service module provides real-time WebSocket communication for Player vs Player (PvP) chess games. It handles game matching, move validation, game state synchronization, and reconnection logic using Socket.IO and Redis for distributed game state management.

## Purpose

The Socket Service module:
- Manages real-time PvP chess games via WebSocket
- Implements matchmaking system for pairing players
- Handles game moves with optimistic locking
- Manages game state in Redis
- Supports reconnection and disconnect handling
- Integrates with Stockfish for move validation

## Architecture

The module consists of:
- **SocketServiceGateway**: WebSocket gateway (Socket.IO)
- **SocketServiceService**: Core game logic and state management
- **SocketServiceModule**: Module configuration

### Dependencies

- **Socket.IO**: WebSocket server implementation
- **Redis**: Game state storage and atomic operations
- **chess.js**: Move validation and game state
- **SnapshotServiceService**: Game result storage
- **Lua Scripts**: Redis atomic operations for game state

### WebSocket Configuration

- **Namespace**: `/notifications`
- **Path**: `/notification/socket.io`
- **CORS**: Currently allows all origins (should be restricted)

---

## Core Functionality

### Connection Management

#### Initial Connection

The `handleConnection()` method handles client connections:

**Flow:**
1. Extracts user ID from JWT token (via AuthGuard)
2. Checks if user has existing game room
3. Handles reconnection if room exists
4. Joins user to appropriate Socket.IO room

**Reconnection Logic:**
- Checks for existing game room in Redis
- Validates disconnect timeout hasn't expired
- Updates socket ID in room
- Emits game state to reconnected client

---

#### Disconnection Handling

The `handleDisconnect()` method handles client disconnections:

**Flow:**
1. Extracts user ID from socket data
2. Finds user's game room
3. Marks user as disconnected
4. Sets disconnect timestamp
5. Updates room with disconnect status
6. Schedules disconnect timeout (30 seconds)

**Disconnect Timeout:**
- 30-second grace period for reconnection
- After timeout, game is forfeited
- Winner is determined based on who disconnected

---

### Matchmaking System

The `findGame()` method implements matchmaking:

**Matchmaking Flow:**
1. User requests to find a game
2. System attempts to match with waiting player
3. If no match, user enters waiting queue
4. When match found, game room is created
5. Both players are notified of game start

**Matchmaking States:**
- **Waiting**: User is in queue, waiting for opponent
- **Match**: Match found, game room created
- **Already In Room**: User already has active game

**Redis Operations:**
- Uses Lua scripts for atomic matchmaking
- Prevents race conditions
- Ensures single game per user

---

### Move Processing

The `makeMove()` method handles game moves:

**Move Validation:**
1. Validates room exists
2. Validates user is player in room
3. Validates it's user's turn
4. Validates move legality using chess.js
5. Applies move to game state

**Optimistic Locking:**
- Uses version numbers for conflict prevention
- Redis Lua script ensures atomic updates
- Prevents concurrent move processing

**Game Over Detection:**
- Checks for checkmate
- Checks for stalemate
- Checks for draw conditions
- Determines winner

**Move Broadcasting:**
- Broadcasts move to both players
- Updates game state in Redis
- Stores snapshot if game ends

---

## WebSocket Events

### Client → Server Events

#### `find_game`
Initiates matchmaking process.

**Authentication:** Required (JWT token in handshake)

**Response Events:**
- `waiting_for_opponent`: User is in queue
- `game_started`: Match found, game begins
- `creating_issue`: Error during matchmaking

---

#### `make_move`
Sends a move in the game.

**Authentication:** Required

**Payload:**
```typescript
{
  roomId: string;
  move: {
    from: string;      // Square (e.g., "e2")
    to: string;         // Square (e.g., "e4")
    promotion?: string; // Promotion piece (optional)
  }
}
```

**Response Events:**
- `move_made`: Move was successful
- `game_finished`: Game ended after move

---

### Server → Client Events

#### `waiting_for_opponent`
Emitted when user enters matchmaking queue.

**Payload:** None

---

#### `game_started`
Emitted when match is found and game begins.

**Payload:**
```typescript
{
  fen: string;
  turn: 'white' | 'black';
  roomId: string;
  white: string;  // User ID
  black: string;  // User ID
}
```

---

#### `move_made`
Emitted when a move is made.

**Payload:**
```typescript
{
  move: {
    from: string;
    to: string;
    promotion?: string;
  }
}
```

---

#### `game_resumed`
Emitted when user reconnects to active game.

**Payload:**
```typescript
{
  fen: string;
  turn: 'white' | 'black';
  allMoves: MoveType[];
}
```

---

#### `game_finished`
Emitted when game ends.

**Payload:**
```typescript
{
  winner: 'white' | 'black' | 'draw';
  winnerId?: string;
  reason: 'checkmate' | 'draw' | 'leave';
}
```

---

#### `creating_issue`
Emitted when matchmaking encounters an error.

**Payload:** None

---

## Redis Data Structures

### Game Room
**Key:** `chess:room:{roomId}`

**Structure:**
```typescript
{
  roomId: string;
  fen: string;
  turn: 'white' | 'black';
  white: {
    userId: string;
    socketId: string;
  };
  black: {
    userId: string;
    socketId: string;
  };
  allMoves: MoveType[];
  version: number;          // For optimistic locking
  isGameOver: boolean;
  isCheckmate?: boolean;
  isDraw?: boolean;
  winner?: 'white' | 'black' | 'draw';
  winnerId?: string;
  finishedAt?: number;
  createdAt: number;
  disconnected?: {
    userId: string;
    at: number;
  };
}
```

**TTL:** 3600 seconds (1 hour) when active, 30 seconds when disconnected

---

### User-Room Mapping
**Key:** `chess:user:{userId}:room`

**Value:** Room ID (string)

**Purpose:** Quick lookup of user's active game

---

### Waiting Queue
**Key:** `chess:waiting_queue`

**Structure:** Redis sorted set or list (managed by Lua scripts)

**Purpose:** Stores users waiting for match

---

## Lua Scripts

The service uses Redis Lua scripts for atomic operations:

### Matchmaking Script
- Atomically matches two waiting players
- Creates game room
- Removes players from queue
- Prevents race conditions

### Move Processing Script
- Atomically updates game state
- Validates version number
- Prevents concurrent moves
- Returns update status

### Room Management Scripts
- `findGameRoom`: Retrieves room data
- `createGameRoom`: Creates new room
- `updateGameRoom`: Updates room state
- `removeGameRoom`: Deletes room

---

## Service Methods

### `findGame(server: Server, client: Socket, userId: string)`

Initiates matchmaking process.

**Flow:**
1. Calls `matchOrCreateRoom()` for atomic matchmaking
2. Handles different matchmaking states
3. Joins players to Socket.IO room
4. Emits appropriate events

---

### `makeMove(server: Server, client: Socket, payload: GameMakeMoveDto)`

Processes a game move.

**Flow:**
1. Validates room exists
2. Validates user is player
3. Validates turn
4. Validates move legality
5. Updates game state atomically
6. Broadcasts move
7. Handles game over

---

### `handleReconnect(server: Server, client: Socket)`

Handles client reconnection.

**Flow:**
1. Finds user's game room
2. Checks disconnect timeout
3. Updates socket ID
4. Joins Socket.IO room
5. Emits game state

---

### `handleDisconnect(server: Server, client: Socket)`

Handles client disconnection.

**Flow:**
1. Finds user's game room
2. Marks as disconnected
3. Updates room with disconnect info
4. Schedules timeout check

---

### `checkDisconnectTimeout(server: Server, room: IPvPGameRoom)`

Checks if disconnect timeout has expired.

**Flow:**
1. Checks if 30 seconds have passed
2. If expired, forfeits game
3. Determines winner
4. Stores snapshot
5. Cleans up room

---

### `finishGameInternal(server: Server, room: IPvPGameRoom)`

Handles game completion.

**Flow:**
1. Stores game snapshot
2. Emits game finished event
3. Cleans up Redis data
4. Removes user-room mappings

---

## Security Considerations

1. **Authentication**: All connections require JWT token
2. **Authorization**: Users can only move in their own games
3. **Turn Validation**: Prevents moving out of turn
4. **Move Validation**: All moves validated for legality
5. **Optimistic Locking**: Prevents race conditions

## Error Handling

- **Room Not Found**: Gracefully handles missing rooms
- **Invalid Moves**: Returns error, doesn't crash
- **Version Conflicts**: Handles concurrent move attempts
- **Disconnect Timeouts**: Automatically forfeits games

## Performance Considerations

1. **Redis Atomic Operations**: Lua scripts ensure consistency
2. **Optimistic Locking**: Version numbers prevent conflicts
3. **Connection Pooling**: Socket.IO manages connections efficiently
4. **Room Cleanup**: Automatic cleanup prevents memory leaks

## Integration Points

- **SnapshotServiceService**: Stores game results
- **Redis**: Game state and matchmaking
- **Socket.IO**: WebSocket communication
- **chess.js**: Move validation

## Future Improvements

1. **Game Time Controls**: Add time limits per move/game
2. **Spectator Mode**: Allow watching games
3. **Game Replay**: Store and replay game history
4. **Rating System**: Implement ELO rating
5. **Tournament Mode**: Support tournament games
6. **Private Games**: Allow inviting specific players
7. **Takeback Requests**: Support move takebacks
8. **Draw Offers**: Allow draw offers
9. **Resignation**: Support resigning games
10. **Better CORS**: Restrict CORS to specific domains
