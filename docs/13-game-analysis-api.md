# Game Analysis API

## Overview

Authenticated clients can request **multi-line engine analysis** for any legal chess position. The HTTP surface lives in **GameAnalysisModule** but is exposed under the same **`/game`** prefix as other game endpoints and grouped under the **Game Service** tag in Swagger.

## Endpoint

- **Method / path:** `POST /game/position/analyze`
- **Auth:** Same as other game routes (`AuthGuard` / access token cookie).
- **Validation:** `ValidationPipe` (whitelist, forbid unknown fields) on the analysis controller.

## Request body (`AnalyzePositionDto`)

| Field | Required | Default | Constraints |
|--------|-----------|---------|-------------|
| `fen` | yes | — | Non-empty FEN string |
| `recommendedMovesCount` | no | **3** | Integer 1–5 (Stockfish MultiPV) |
| `depth` | no | **12** | Integer 1–30 (`go depth`) |

Omitting `recommendedMovesCount` or `depth` means the server applies the defaults above.

## Response (`AnalyzePositionResponseDto`)

| Field | Description |
|--------|-------------|
| `fen` | Validated FEN that was analyzed |
| `depth` | Depth requested (`go depth`) |
| `depthReached` | Maximum depth seen in engine `info` lines (may fall back to requested depth if needed) |
| `bestMove` | `null` if the position is terminal or no lines returned; otherwise same shape as PvE `botMove` (`from`, `to`, optional `promotion`) |
| `lines` | Ordered best-first; each entry has `rank`, `move` (same shape as `bestMove`), `evaluation`, `pvUci` |

### Evaluation (`kind` / `value`)

- **`cp`:** Centipawns from **the side to move** (Stockfish convention).
- **`mate`:** Mate distance: positive = side to move mates in N; negative = mated in N.

### Principal variation

`pvUci` is the list of UCI tokens Stockfish reported for that MultiPV line (from the analyzed position).

## Terminal positions

If `chess.js` reports the game is already over (checkmate, stalemate, etc.), the handler returns **200** with `bestMove: null`, `lines: []`, `depthReached: 0`, and `depth` set to the requested or default depth.

## Errors

- **400:** Invalid FEN or invalid body (validation).
- **401:** Not authenticated.
- **503:** Engine busy, analysis timeout, or other engine failure (client should retry or lower depth).

## Implementation map

- **Controller:** `src/game-analysis/game-analysis.controller.ts`
- **Service:** `src/game-analysis/game-analysis.service.ts`
- **Engine:** `GameEngineService.analyzeMultiPv()` in `src/game-engine/game-engine.service.ts`
- **DTOs:** `common/dtos/analysis/`

See also [Game Engine](./05-game-engine.md) for UCI details and MultiPV reset behavior.
