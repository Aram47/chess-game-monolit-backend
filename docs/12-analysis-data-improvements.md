# Analysis Data Improvements

This document captures practical improvements for puzzle/game analysis data, based on the current backend implementation.

Goal: keep current architecture (Postgres + Redis + Mongo snapshots), but make analysis/replay/analytics more reliable and easier to evolve.

---

## Current State (What already works)

### Problem analysis data (`ProblemSnapshot`)

Current fields:
- `userId`
- `problemId`
- `moves`
- `finalFen`
- `theme`
- `level`
- `solevedAt`
- `durationMs`

What this already enables:
- Replay of solved attempt from puzzle start (if puzzle is loaded by `problemId`)
- Basic performance metrics (duration, solve timestamp)
- Fetching puzzle metadata from Postgres via `problemId`

### Game analysis data (`GameSnapshot`)

Current fields:
- `fen` (final)
- `white`
- `black`
- `gameCreatedAt`
- `finishedAt`
- `winnerColor`
- `winnerId`
- `isCheckmate`
- `isDraw`
- `allMoves`

What this already enables:
- Full replay from moves
- Outcome-based analysis (checkmate/draw/winner)
- Player-specific history and filtering

---

## Gaps and Risks to Fix

### 1) Schema correctness risk (`ProblemSnapshot`)

`ProblemSnapshot` schema setup must be fully decorator-based and explicit:
- Ensure `@Schema({ timestamps: true, versionKey: false })` is present.
- Ensure all persisted fields are decorated with `@Prop(...)` (including `theme` and `level`).

Why:
- Prevent silent field drops or inconsistent persistence.

### 2) PvE snapshot persistence

`storePvEGameResult(...)` is implemented and now persists PvE game snapshots.

Current behavior:
- PvE snapshots are stored in `GameSnapshot`.
- `isBot: true` is set for easy UX filtering in history.

### 3) Cross-DB integrity is logical only

Mongo stores Postgres IDs as strings (`userId`, `problemId`, `white`, `black`, `winnerId`), without DB-level foreign keys.

Why:
- This is normal for polyglot storage, but integrity must be enforced by app logic and checks.

### 4) Draw/winner schema edge cases

`winnerId` is required in game snapshot schema, but draw outcomes may not naturally have a winner user id.

Why:
- Can cause schema friction or forced placeholder values.

---

## Recommended Improvements (Priority Order)

## P0 (Do first)

1. **Fix `ProblemSnapshot` schema definitions**
   - Use proper decorators and explicit field types for all saved fields.

2. **Keep PvE snapshot structure stable**
   - Maintain `isBot: true` and stable `allMoves/fen/outcome` fields for frontend analysis.
   - Add tests for draw/checkmate bot games.

3. **Standardize move contract**
   - Keep `MoveType` as canonical move shape (`from`, `to`, `promotion?`) across API, service, Redis, and Mongo snapshots.

## P1 (Next reliability layer)

4. **Add indexes for analysis queries**
   - `ProblemSnapshot`: `userId`, `problemId`, `solevedAt`
   - `GameSnapshot`: keep current indexes; add composites if query patterns require.

5. **Clarify winner semantics**
   - Make `winnerId` optional for draws, or define explicit draw convention.

6. **Centralize ID mapping**
   - Use one mapper for Postgres ID -> Mongo string fields to avoid drift.

## P2 (Analytics-ready enhancements)

7. **Add `startFen` / `initialFen` in snapshots**
   - `ProblemSnapshot.startFen`, `GameSnapshot.initialFen`
   - Reduces dependency on external lookups for replay bootstrapping.

8. **Add analysis metadata**
   - `gameType` (`PVP`/`PVE`), difficulty/engine level, optional per-move annotations later.

9. **Add reconciliation job**
   - Periodically validate snapshot references against Postgres IDs.

---

## Suggested Target Models (Minimal Evolution)

### ProblemSnapshot target additions
- keep existing fields
- add:
  - `startFen: string`
  - `attemptStatus: 'SOLVED' | 'FAILED' | 'ABANDONED'` (future-friendly)

### GameSnapshot target additions
- keep existing fields
- add:
  - `initialFen: string`
  - `gameType: 'PVP' | 'PVE'`
  - optional: `timeControl`, `engineLevel`

---

## Why this is a good long-term approach

- Keeps runtime fast (Redis state)
- Keeps primary business data normalized (Postgres)
- Keeps analysis/history scalable (Mongo snapshots)
- Gives frontend enough data for replay now
- Leaves a clean path to deeper analytics later

---

## Quick Checklist Before Building Analytics Features

- [ ] `ProblemSnapshot` schema is fully explicit and tested
- [x] PvE snapshot persistence implemented
- [ ] `MoveType` consistently used across layers
- [ ] Snapshot indexes added for real query paths
- [ ] Draw/winner semantics finalized
- [ ] Cross-DB ID mapping conventions documented

