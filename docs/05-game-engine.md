# Game Engine Module

## Overview

The Game Engine module provides chess engine integration using Stockfish, a powerful open-source chess engine. It manages a pool of Stockfish engine processes to handle concurrent move calculations for bot games, with automatic process management and error recovery.

## Purpose

The Game Engine module:
- Manages a pool of Stockfish engine processes
- Calculates best moves for bot opponents
- Handles engine lifecycle (creation, restart, cleanup)
- Provides different difficulty levels (easy, medium, hard)
- Ensures thread-safe engine access

## Architecture

The module consists of:
- **GameEngineService**: Core engine management and move calculation
- **GameEngineController**: HTTP controller (currently empty, for future use)
- **GameEngineModule**: Module configuration

### Dependencies

- **Stockfish**: External chess engine binary (must be installed on system)
- **child_process**: Node.js module for spawning Stockfish processes

## Core Functionality

### Engine Pool Management

The service maintains a pool of Stockfish engine processes for concurrent move calculations:

**Pool Configuration:**
- Default pool size: 4 engines
- Engines are created on module initialization
- Engines are managed with busy flags to prevent concurrent access
- Failed engines are automatically restarted

**Engine Lifecycle:**
1. **Initialization**: Engines are spawned and initialized with UCI protocol
2. **Usage**: Engines are marked as busy during move calculation
3. **Cleanup**: Engines are killed on application shutdown
4. **Recovery**: Failed engines are automatically restarted

---

### Move Calculation

The `getBestMove()` method calculates the best move for a given position:

**Process:**
1. Acquires an available engine from the pool
2. Sends UCI commands to Stockfish:
   - `ucinewgame`: Starts a new game
   - `position fen {fen}`: Sets the position
   - `go movetime {time}`: Calculates best move with time limit
3. Parses Stockfish output for best move
4. Handles timeouts and errors
5. Returns move in standardized format

**Timeout Handling:**
- Default timeout: 2000ms (2 seconds)
- On timeout: Engine is restarted and error is thrown
- Prevents hanging on engine failures

**Difficulty Levels:**
- **Easy**: 30% chance of 50ms, 70% chance of 150ms calculation time
- **Medium**: 300ms calculation time
- **Hard**: 600ms calculation time

The difficulty affects how long Stockfish thinks about the move, with harder levels allowing more time for better moves.

---

### Engine Selection

The `getEngine()` method implements round-robin engine selection:

**Selection Logic:**
1. Iterates through engine pool in round-robin fashion
2. Checks if engine process is alive
3. Checks if engine is busy
4. Restarts engine if process is killed
5. Marks engine as busy before returning
6. Throws error if all engines are busy

**Concurrency:**
- Each engine can handle one move calculation at a time
- Busy flag prevents concurrent access to same engine
- Round-robin ensures load distribution

---

### Engine Creation

The `createEngine()` method spawns and initializes a Stockfish process:

**Initialization Steps:**
1. Spawns `stockfish` process
2. Sends UCI initialization commands:
   - `uci`: Enables UCI protocol
   - `isready`: Waits for engine readiness
3. Sets up error handlers:
   - `stderr`: Logs engine errors
   - `exit`: Logs exit codes
   - `close`: Logs close events
   - `error`: Logs spawn failures
4. Returns engine wrapper with process and busy flag

**Engine Wrapper:**
```typescript
{
  process: ChildProcess;
  busy: boolean;
}
```

---

### Engine Restart

The `restartEngine()` method handles engine recovery:

**Process:**
1. Attempts to kill old engine process
2. Creates new engine instance
3. Replaces engine in pool at specified index
4. Logs restart operation

**Error Handling:**
- Gracefully handles kill errors
- Ensures new engine is properly initialized

---

### Cleanup on Shutdown

The service implements proper cleanup on application shutdown:

**Shutdown Handlers:**
- `exit`: Normal process exit
- `SIGINT`: Ctrl+C interrupt
- `SIGTERM`: Docker/systemd termination
- `uncaughtException`: Unexpected errors

**Cleanup Process:**
1. Logs shutdown message
2. Kills all engine processes
3. Exits application

---

## API Methods

### `getBestMove(fen: string, level: 'easy' | 'medium' | 'hard')`

Calculates the best move for a given position.

**Parameters:**
- `fen`: FEN string representing chess position
- `level`: Difficulty level (easy, medium, hard)

**Returns:**
```typescript
Promise<MoveType>  // { from: string, to: string, promotion?: string }
```

**Throws:**
- `Error('Stockfish timeout')`: If calculation exceeds timeout
- `Error('No legal moves')`: If no moves available
- `Error('All Stockfish engines are busy')`: If pool is exhausted

**Example:**
```typescript
const move = await gameEngineService.getBestMove(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'medium'
);
// Returns: { from: 'e2', to: 'e4' }
```

---

## Internal Methods

### `sendGoCommand(engine: StockfishEngineWrapper, level: 'easy' | 'medium' | 'hard')`

Sends the `go` command to Stockfish with appropriate time limit.

**Time Limits:**
- Easy: 50ms (30%) or 150ms (70%)
- Medium: 300ms
- Hard: 600ms

---

### `getEngine()`

Selects an available engine from the pool.

**Returns:**
- Available engine wrapper with `busy` flag set to `true`

**Throws:**
- `Error('All Stockfish engines are busy')`: If no engines available

---

## UCI Protocol

The service communicates with Stockfish using the Universal Chess Interface (UCI) protocol:

**Commands Used:**
- `uci`: Enables UCI mode
- `isready`: Checks engine readiness
- `ucinewgame`: Starts new game calculation
- `position fen {fen}`: Sets board position
- `go movetime {ms}`: Calculates best move with time limit

**Response Parsing:**
- Parses `bestmove` output from Stockfish
- Extracts move in UCI format (e.g., "e2e4")
- Converts to internal `MoveType` format

---

## Error Handling

### Timeout Errors
- If move calculation exceeds timeout, engine is restarted
- Error is thrown to caller
- Prevents hanging on engine failures

### Engine Failures
- Process exit/crash detection
- Automatic engine restart
- Error logging for debugging

### Busy Pool
- Throws error if all engines are busy
- Prevents indefinite waiting
- Caller should implement retry logic

---

## Performance Considerations

1. **Pool Size**: Default 4 engines balances performance and resource usage
2. **Timeout**: 2-second timeout prevents long waits
3. **Difficulty Levels**: Different calculation times for varied bot strength
4. **Round-Robin**: Ensures even load distribution
5. **Process Management**: Automatic restart prevents resource leaks

## System Requirements

- **Stockfish Binary**: Must be installed and available in PATH
- **System Resources**: Each engine process consumes memory and CPU
- **Process Limits**: Ensure system can handle multiple engine processes

## Integration Points

- **GameServiceService**: Uses `getBestMove()` for bot moves in PvE games
- **Stockfish Binary**: External dependency, must be installed
- **Node.js child_process**: For process management

## Future Improvements

1. **Dynamic Pool Sizing**: Adjust pool size based on load
2. **Engine Health Monitoring**: Track engine performance and errors
3. **Move Caching**: Cache common positions for faster responses
4. **Difficulty Tuning**: Fine-tune difficulty levels based on player skill
5. **Engine Configuration**: Allow custom Stockfish parameters
6. **Async Queue**: Implement queue for move requests when pool is busy
7. **Metrics**: Add metrics for engine usage and performance

## Troubleshooting

### Engine Not Found
- Ensure Stockfish is installed: `which stockfish`
- Check PATH environment variable
- Install Stockfish if missing

### All Engines Busy
- Increase pool size if needed
- Check for engine hangs or timeouts
- Monitor system resources

### Engine Crashes
- Check Stockfish version compatibility
- Review error logs for patterns
- Consider engine restart logic improvements
