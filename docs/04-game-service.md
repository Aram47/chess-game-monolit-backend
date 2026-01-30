# Game Service Module

## Overview

The Game Service module is the core service for managing chess problems, problem-solving sessions, and player-versus-bot (PvE) games. It handles problem retrieval, problem solving workflows, game state management, and integrates with the game engine for bot moves.

## Purpose

The Game Service module:
- Manages chess problems (CRUD operations)
- Handles problem-solving sessions with Redis
- Manages player-versus-bot games
- Validates chess moves using chess.js
- Integrates with Stockfish engine for bot moves
- Stores game/problem snapshots for analytics

## Architecture

The module consists of:
- **GameServiceController**: HTTP REST API endpoints
- **GameServiceService**: Core business logic
- **GameServiceModule**: Module configuration

### Dependencies

- **TypeORM**: For problem data persistence (PostgreSQL)
- **Redis**: For session and game state management
- **chess.js**: For chess move validation and game state
- **GameEngineService**: For bot move generation
- **SnapshotServiceService**: For storing game/problem results

### Database Entities

- **ChessProblem**: Chess problem definitions
- **ProblemTheme**: Problem themes/tags
- **ProblemCategory**: Problem categories
- **Theme**: Theme definitions

## Core Functionality

### Problem Management

#### Problem Retrieval

The `getProblems()` method provides filtered and paginated problem retrieval:

**Filtering Options:**
- `categoryId`: Filter by problem category
- `difficultyLevel`: Filter by difficulty (EASY, MEDIUM, HARD)
- `isPayable`: Filter by payment requirement
- `themeId`: Filter by problem theme

**Pagination:**
- Supports standard pagination (page, limit, skip)
- Returns total count for pagination metadata

**Query Logic:**
- Only returns active problems (`isActive = true`)
- Joins with category for filtering
- Joins with themes for theme-based filtering

---

### Problem Solving Workflow

#### Starting a Problem

The `startProblem()` method:
1. Validates problem exists and is active
2. Creates a problem session in Redis
3. Stores initial FEN position and solution moves
4. Sets session expiration (30 minutes)
5. Returns session status

**Session Structure:**
```typescript
{
  userId: number;
  problemId: number;
  fen: string;              // Initial position
  solutionMoves: MoveType[]; // Expected solution
  userMoves: MoveType[];     // User's moves so far
  startedAt: number;         // Timestamp
}
```

**Redis Key Format:**
```
problem_session:user:{userId}:problem:{problemId}
```

---

#### Making a Move

The `makeMove()` method:
1. Retrieves problem session from Redis
2. Validates move using chess.js
3. Compares move with expected solution move
4. Updates session with accepted move
5. Checks if problem is solved
6. Stores snapshot if solved
7. Returns move status

**Move Validation:**
- Validates move legality using chess.js
- Compares move with expected solution sequence
- Throws error if move is invalid or incorrect

**Solution Detection:**
- Problem is solved when all solution moves are completed
- Creates problem snapshot with completion data
- Deletes session from Redis

---

#### Finishing a Problem

The `finishProblem()` method:
1. Retrieves problem session
2. Deletes session from Redis
3. Returns finish status

**Note:** Currently, finishing doesn't store partial progress. Consider storing incomplete attempts for analytics.

---

### Player vs Bot (PvE) Games

#### Starting a PvE Game

The `startGameWithBot()` method:
1. Generates unique room ID
2. Initializes chess game with starting position
3. Creates game room in Redis
4. Sets room expiration (1 hour)
5. Returns room information

**Room Structure:**
```typescript
{
  roomId: string;
  fen: string;              // Current position
  turn: 'w' | 'b';         // Current turn
  white: { userId: string };
  black: 'bot';
  level: 'easy' | 'medium' | 'hard';
  allMoves: MoveType[];
  createdAt: number;
  version: number;          // For optimistic locking
}
```

**Redis Key Format:**
```
pve:room:{roomId}
```

**Security Consideration:**
- Currently, multiple room creation requests are not prevented
- Consider implementing Redis atomic operations to prevent duplicate rooms

---

#### Making a Move in PvE Game

The `makeMoveInTheGameWithBot()` method:
1. Validates room exists and game is active
2. Validates user ownership
3. Validates and applies user move
4. Checks for game over conditions
5. Generates bot move using Stockfish engine
6. Applies bot move
7. Checks for game over after bot move
8. Updates room state in Redis
9. Returns game state

**Move Flow:**
1. User move validation and application
2. Game over check (checkmate, stalemate, draw)
3. Bot move generation via GameEngineService
4. Bot move application
5. Final game over check
6. Room state update

**Game Over Handling:**
- Detects checkmate, stalemate, and draw conditions
- Stores game snapshot
- Deletes room from Redis
- Returns final game state

---

## API Endpoints

### Problem Endpoints

#### GET `/game/problems`
Retrieves paginated and filtered list of problems.

**Authentication:** Required (AuthGuard)

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  categoryId?: number;
  difficultyLevel?: string;
  isPayable?: boolean;
  themeId?: number;
}
```

**Response:**
```typescript
{
  data: ChessProblem[];
  total: number;
  page: number;
  limit: number;
}
```

---

#### POST `/game/problems/:id/start`
Starts a problem-solving session.

**Authentication:** Required (AuthGuard)

**Path Parameters:**
- `id`: Problem ID (number)

**Response:**
```typescript
{
  status: 'started';
}
```

**Flow:**
1. Validates problem exists
2. Creates Redis session
3. Returns start status

---

#### POST `/game/problems/:id/move`
Makes a move in a problem.

**Authentication:** Required (AuthGuard)

**Path Parameters:**
- `id`: Problem ID (number)

**Request Body:**
```typescript
{
  move: string;  // Move in UCI format (e.g., "e2e4")
}
```

**Response:**
```typescript
{
  status: 'move accepted' | 'solved';
}
```

**Flow:**
1. Validates session exists
2. Validates move legality
3. Compares with solution
4. Updates session or marks as solved

---

#### POST `/game/problems/:id/finsh`
Finishes a problem session.

**Authentication:** Required (AuthGuard)

**Path Parameters:**
- `id`: Problem ID (number)

**Response:**
```typescript
{
  status: 'finished';
}
```

**Note:** Typo in endpoint name (`finsh` instead of `finish`)

---

### PvE Game Endpoints

#### POST `/game/start`
Starts a new game with bot.

**Authentication:** Required (AuthGuard)

**Response:**
```typescript
{
  roomId: string;
  fen: string;
  color: 'white';
}
```

**Flow:**
1. Creates game room
2. Initializes chess position
3. Returns room information

---

#### POST `/game/move/:id`
Makes a move in a PvE game.

**Authentication:** Required (AuthGuard)

**Path Parameters:**
- `id`: Room ID (string)

**Request Body:**
```typescript
{
  from: string;      // Square (e.g., "e2")
  to: string;        // Square (e.g., "e4")
  promotion?: string; // Promotion piece (optional)
}
```

**Response:**
```typescript
{
  fen: string;
  userMove: Move;
  botMove: MoveType;
}
```

**Flow:**
1. Validates room and ownership
2. Applies user move
3. Generates bot move
4. Applies bot move
5. Returns updated game state

---

## Internal Methods

### Problem Management

#### `createProblem(dto: CreateProblemDto)`
Creates a new chess problem (used by OwnerService).

**Parameters:**
```typescript
{
  fen: string;
  solutionMoves: MoveType[];
  description: string;
  difficultyLevel: ProblemDifficultyLevel;
  isPayable: boolean;
  category: string;  // Category name
  isActive: boolean;
}
```

#### `createProblemCategory(dto: CreateProblemCategoryDto)`
Creates a new problem category (used by OwnerService).

#### `deleteChessProblemById(id: number)`
Deletes a chess problem.

#### `deleteProblemCategoryById(id: number)`
Deletes a problem category.

---

### Helper Methods

#### `getSessionKey(userId: number, problemId: number)`
Generates Redis key for problem session.

#### `finishProblemInternal(snapshotDto: ProblemSnapshotDto)`
Stores problem snapshot when solved.

#### `finishPvEGame(room: IPvEGameRoom, chess: Chess)`
Handles game completion logic:
- Determines winner
- Sets game over flags
- Stores game snapshot
- Cleans up Redis room

---

## Data Models

### ChessProblem Entity
```typescript
{
  id: number;
  fen: string;                    // Initial position
  solutionMoves: MoveType[];      // Solution sequence
  description: string;
  difficultyLevel: ProblemDifficultyLevel;
  isPayable: boolean;
  isActive: boolean;
  category: ProblemCategory;
  themes: ProblemTheme[];
}
```

### ProblemSession (Redis)
```typescript
{
  userId: number;
  problemId: number;
  fen: string;
  solutionMoves: MoveType[];
  userMoves: MoveType[];
  startedAt: number;
}
```

### IPvEGameRoom (Redis)
```typescript
{
  roomId: string;
  fen: string;
  turn: 'w' | 'b';
  white: { userId: string };
  black: 'bot';
  level: 'easy' | 'medium' | 'hard';
  allMoves: MoveType[];
  createdAt: number;
  version: number;
  isGameOver?: boolean;
  finishedAt?: number;
  winner?: 'white' | 'black' | 'draw';
  winnerId?: string;
  isCheckmate?: boolean;
  isDraw?: boolean;
}
```

## Integration Points

- **GameEngineService**: Generates bot moves using Stockfish
- **SnapshotServiceService**: Stores problem and game snapshots
- **Redis**: Session and game state storage
- **PostgreSQL**: Problem data persistence
- **chess.js**: Move validation and game state management

## Security Considerations

1. **Session Isolation**: Each user has isolated problem sessions
2. **Room Ownership**: PvE games validate user ownership
3. **Move Validation**: All moves are validated for legality
4. **Session Expiration**: Sessions expire after 30 minutes
5. **Room Expiration**: Game rooms expire after 1 hour

## Error Handling

- **404 Not Found**: Problem or session not found
- **400 Bad Request**: Invalid move or game already finished
- **Redis Errors**: Handled gracefully with appropriate error messages

## Future Improvements

1. **Atomic Room Creation**: Prevent duplicate room creation
2. **Partial Problem Progress**: Store incomplete problem attempts
3. **Problem Hints**: Add hint system for problems
4. **Difficulty Adjustment**: Dynamic bot difficulty based on player skill
5. **Game Replay**: Store and replay game history
6. **Time Controls**: Add time limits for problems and games
