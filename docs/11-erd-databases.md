# Database ERDs

This document contains ERDs for:

1. PostgreSQL schema
2. MongoDB collections
3. Cross-database logical connections (user and snapshots approach)

Important: PostgreSQL and MongoDB have no physical foreign keys between them. Cross-database links are maintained by application logic and IDs stored as strings.

---

## 1) PostgreSQL ERD

```mermaid
erDiagram
  USERS {
    int id PK
    varchar name
    varchar surname
    varchar username UK
    varchar email UK
    varchar password "select:false"
    timestamp createdAt
    timestamp updatedAt
  }

  USER_RELATED_DATA {
    int id PK
    int userId FK
    varchar role "default USER"
    varchar plan "default FREE"
    bigint xp
    int8 level
    timestamp createdAt
    timestamp updatedAt
  }

  PROBLEM_CATEGORIES {
    int id PK
    varchar name
    text description
    int order
    boolean isActive
  }

  CHESS_PROBLEMS {
    int id PK
    int category_id FK
    text fen
    json solutionMoves
    text description
    enum difficultyLevel
    boolean isPayable
    boolean isActive
  }

  THEMES {
    int id PK
    varchar name UK
    text description
    boolean isActive
  }

  PROBLEM_THEMES {
    int id PK
    int problemId
    int themeId
    int problem_id FK
    int theme_id FK
    "UNIQUE(problemId, themeId)"
  }

  USERS ||--|| USER_RELATED_DATA : "1:1 (cascade create, delete)"
  PROBLEM_CATEGORIES ||--o{ CHESS_PROBLEMS : "1:N category_id"
  CHESS_PROBLEMS ||--o{ PROBLEM_THEMES : "1:N problem_id"
  THEMES ||--o{ PROBLEM_THEMES : "1:N theme_id"
```

### PostgreSQL Notes

- `Users` <-> `UserRelatedData` is modeled as one-to-one.
- `chess_problems` belongs to one `problem_categories` row.
- Problem-theme is many-to-many through `problem_themes`.
- In code, `ProblemTheme` includes both scalar columns (`problemId`, `themeId`) and joined relation columns (`problem_id`, `theme_id`), so schema naming should be reviewed for consistency.

---

## 2) MongoDB ERD

```mermaid
erDiagram
  GAME_SNAPSHOT {
    ObjectId _id PK
    string fen
    string white "userId"
    string black "userId"
    number gameCreatedAt
    number finishedAt
    string winnerColor
    string winnerId "userId"
    boolean isCheckmate
    boolean isDraw
    MoveType[] allMoves
    date createdAt
    date updatedAt
  }

  PROBLEM_SNAPSHOT {
    ObjectId _id PK
    string userId
    string problemId
    MoveType[] moves
    string finalFen
    string theme
    string level
    date solvedAt
    number durationMs
  }
```

### MongoDB Notes

- `GameSnapshot` has indexes on `white`, `black`, `finishedAt`.
- `ProblemSnapshot` stores references as plain strings (`userId`, `problemId`), not Mongo ObjectId refs.
- PvP snapshot persistence is implemented.
- PvE snapshot persistence is currently not implemented in service logic (`storePvEGameResult` is stub).

---

## 3) Overall Cross-Database Connection (Postgres <-> Mongo)

```mermaid
erDiagram
  USERS {
    int id PK
  }

  CHESS_PROBLEMS {
    int id PK
  }

  GAME_SNAPSHOT {
    string white "postgres user id"
    string black "postgres user id"
    string winnerId "postgres user id"
  }

  PROBLEM_SNAPSHOT {
    string userId "postgres user id"
    string problemId "postgres chess_problems.id"
  }

  USERS ||..o{ GAME_SNAPSHOT : "logical link via white/black/winnerId"
  USERS ||..o{ PROBLEM_SNAPSHOT : "logical link via userId"
  CHESS_PROBLEMS ||..o{ PROBLEM_SNAPSHOT : "logical link via problemId"
```

### Cross-Database Flow Notes

- **No database-level FK** exists between Postgres and Mongo.
- Linking is done in application services by copying IDs:
  - `GameSnapshot.white/black/winnerId` <- Postgres `Users.id` converted to string.
  - `ProblemSnapshot.userId` <- Postgres `Users.id` converted to string.
  - `ProblemSnapshot.problemId` <- Postgres `chess_problems.id` converted to string.
- This is a denormalized event/history approach:
  - Postgres = operational source of truth.
  - Mongo = historical snapshots/analytics store.
- Because links are logical, integrity depends on service code (not FK constraints).

