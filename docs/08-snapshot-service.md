# Snapshot Service Module

## Overview

The Snapshot Service module is responsible for storing game and problem-solving snapshots for analytics, history, and user progress tracking. It uses MongoDB to persist snapshots of completed games and solved problems.

## Purpose

The Snapshot Service module:
- Stores problem-solving snapshots (completed problems)
- Stores game result snapshots (completed games)
- Provides historical data for analytics
- Enables user progress tracking
- Supports both PvP (Player vs Player) and PvE (Player vs Bot) games

## Architecture

The module consists of:
- **SnapshotServiceService**: Core snapshot storage logic
- **SnapshotServiceController**: HTTP controller (currently empty, for future use)
- **SnapshotServiceModule**: Module configuration with MongoDB

### Dependencies

- **MongoDB**: Document database for snapshot storage
- **Mongoose**: ODM for MongoDB operations
- **TypeORM**: Not used (MongoDB is separate from PostgreSQL)

### Database Models

- **ProblemSnapshot**: Stores problem-solving results
- **GameSnapshot**: Stores game completion results

---

## Core Functionality

### Problem Snapshot Storage

The `storeProblemSnapshot()` method stores completed problem data:

**Snapshot Data:**
- User ID
- Problem ID
- Final FEN position
- Solution moves made
- Completion timestamp
- Duration (milliseconds)
- Theme and difficulty level

**Use Cases:**
- Track user progress
- Analyze problem difficulty
- Calculate statistics
- Generate leaderboards

---

### Game Snapshot Storage

The `storeGameResultSnapshot()` method stores completed game data:

**Game Types:**
- **PvP Games**: Player vs Player games
- **PvE Games**: Player vs Bot games (currently not fully implemented)

**Snapshot Data (PvP):**
- Game FEN (final position)
- White and black player IDs
- All moves made
- Winner information
- Game completion details
- Timestamps

---

## API Methods

### `storeProblemSnapshot(snapshot: ProblemSnapshotDto)`

Stores a problem-solving snapshot.

**Parameters:**
```typescript
{
  userId: string;
  problemId: string;
  finalFen: string;
  solevedAt: Date;
  durationMs: number;
  moves: MoveType[];
  theme: string;
  level: string;
}
```

**Returns:**
- Created ProblemSnapshot document

**Flow:**
1. Creates ProblemSnapshot document
2. Saves to MongoDB
3. Returns saved document

---

### `storeGameResultSnapshot(room: IPvPGameRoom | IPvEGameRoom)`

Stores a game result snapshot.

**Parameters:**
- `room`: Game room object (PvP or PvE)

**Returns:**
- Created GameSnapshot document (for PvP)
- Currently returns undefined for PvE (not implemented)

**Flow:**
1. Determines game type (PvP or PvE)
2. Routes to appropriate storage method
3. Stores snapshot in MongoDB

---

### `storePvPGameResult(room: IPvPGameRoom)`

Stores a Player vs Player game snapshot.

**Parameters:**
```typescript
{
  roomId: string;
  fen: string;
  white: { userId: string; socketId: string };
  black: { userId: string; socketId: string };
  allMoves: MoveType[];
  turn: 'white' | 'black';
  isGameOver: boolean;
  isCheckmate?: boolean;
  isDraw?: boolean;
  winner?: 'white' | 'black' | 'draw';
  winnerId?: string;
  finishedAt: number;
  createdAt: number;
}
```

**Returns:**
- Created GameSnapshot document

**Stored Data:**
```typescript
{
  fen: string;
  white: string;           // User ID
  black: string;           // User ID
  allMoves: MoveType[];
  winnerId?: string;
  winnerColor?: 'white' | 'black' | 'draw';
  isDraw: boolean;
  isCheckmate: boolean;
  finishedAt: number;
  gameCreatedAt: number;
}
```

---

### `storePvEGameResult(room: IPvEGameRoom)`

Stores a Player vs Bot game snapshot.

**Status:** Not fully implemented

**Note:** The service currently logs the room but doesn't store it. Consider implementing:
- Separate collection for PvE games
- Different schema for bot games
- Bot difficulty level tracking

---

## Data Models

### ProblemSnapshot (MongoDB)
```typescript
{
  _id: ObjectId;
  userId: string;
  problemId: string;
  finalFen: string;
  moves: MoveType[];
  theme: string;
  level: string;
  solevedAt: Date;
  durationMs: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### GameSnapshot (MongoDB)
```typescript
{
  _id: ObjectId;
  fen: string;
  white: string;              // User ID
  black: string;              // User ID
  allMoves: MoveType[];
  winnerId?: string;
  winnerColor?: 'white' | 'black' | 'draw';
  isDraw: boolean;
  isCheckmate: boolean;
  finishedAt: number;
  gameCreatedAt: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Integration Points

- **GameServiceService**: Calls `storeProblemSnapshot()` when problem is solved
- **GameServiceService**: Calls `storeGameResultSnapshot()` when PvE game ends
- **SocketServiceService**: Calls `storeGameResultSnapshot()` when PvP game ends
- **MongoDB**: Document storage for snapshots

---

## MongoDB Configuration

The module connects to MongoDB using Mongoose:

**Connection Configuration:**
- URI: `mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB_NAME}`
- Retry attempts: 5
- Retry delay: 3000ms

**Environment Variables:**
- `MONGO_HOST`: MongoDB host
- `MONGO_PORT`: MongoDB port
- `MONGO_DB_NAME`: MongoDB database name

---

## Use Cases

1. **User Progress Tracking**: Track which problems users have solved
2. **Analytics**: Analyze problem difficulty and completion rates
3. **Game History**: Store completed games for replay
4. **Statistics**: Calculate win rates, average solve times
5. **Leaderboards**: Generate rankings based on snapshots
6. **Achievements**: Track achievements based on completion data

---

## Storage Strategy

### Problem Snapshots
- Stored when problem is completely solved
- Includes all moves made by user
- Tracks completion time for performance analysis

### Game Snapshots
- Stored when game ends (checkmate, draw, resignation)
- Includes complete move history
- Tracks winner and game outcome

---

## Future Improvements

1. **PvE Game Storage**: Implement full PvE game snapshot storage
2. **Partial Problem Progress**: Store incomplete problem attempts
3. **Snapshot Queries**: Add endpoints to retrieve user snapshots
4. **Analytics Endpoints**: Provide aggregated statistics
5. **Data Retention**: Implement data retention policies
6. **Snapshot Compression**: Compress move history for storage efficiency
7. **Batch Operations**: Support bulk snapshot storage
8. **Snapshot Validation**: Validate snapshot data before storage
9. **Indexing**: Add MongoDB indexes for common queries
10. **Archival**: Archive old snapshots to cold storage

---

## Error Handling

- **MongoDB Connection Errors**: Handled by Mongoose retry logic
- **Validation Errors**: Mongoose schema validation
- **Storage Errors**: Propagated to caller for handling

---

## Performance Considerations

1. **MongoDB Indexing**: Consider indexes on userId, problemId, finishedAt
2. **Write Performance**: MongoDB handles high write throughput
3. **Document Size**: Move arrays can grow large; consider limits
4. **Connection Pooling**: Mongoose manages connection pool

---

## Data Privacy

- Snapshots contain user IDs and game data
- Consider GDPR compliance for data retention
- Implement data deletion for user account removal
- Anonymize data for analytics if needed

---

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string configuration
- Verify network connectivity
- Check MongoDB logs

### Storage Failures
- Monitor MongoDB disk space
- Check write permissions
- Verify schema validation
- Review error logs

### Performance Issues
- Add MongoDB indexes
- Monitor document size
- Consider data partitioning
- Review query patterns
