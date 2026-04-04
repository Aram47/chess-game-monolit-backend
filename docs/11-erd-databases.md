# Database ERDs

This document contains ERDs for:

1. PostgreSQL schema (including user inbox notifications for missed SSE)
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
    varchar password "nullable select:false"
    varchar authProvider "local default google for OAuth sign-up"
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
    int elo "default 1500"
    timestamp createdAt
    timestamp updatedAt
  }

  USER_FRIENDS {
    int id PK
    int userId FK "smaller Users.id"
    int friendId FK "larger Users.id"
    varchar status "pending accepted rejected"
    int requestedBy "must be userId or friendId"
    timestamp createdAt
  }

  INBOX_NOTIFICATIONS {
    int id PK
    int userId "recipient logical FK to Users.id"
    varchar eventType "e.g. friend.request.accepted"
    jsonb payload "nullable event payload"
    timestamptz readAt "nullable unread when null"
    timestamp createdAt
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
  USERS ||--o{ USER_FRIENDS : "user userId"
  USERS ||--o{ USER_FRIENDS : "friend friendId"
  USERS ||--o{ INBOX_NOTIFICATIONS : "recipient userId"
  PROBLEM_CATEGORIES ||--o{ CHESS_PROBLEMS : "1:N category_id"
  CHESS_PROBLEMS ||--o{ PROBLEM_THEMES : "1:N problem_id"
  THEMES ||--o{ PROBLEM_THEMES : "1:N theme_id"
```

### PostgreSQL Notes

- `Users.password` may be **null** for Google sign-up; `Users.authProvider` distinguishes `local` vs `google`.
- `Users` <-> `UserRelatedData` is modeled as one-to-one.
- `UserFriends`: one row per unordered pair; `userId` < `friendId` enforced by a check constraint; unique on `(userId, friendId)`; both FKs cascade on user delete.
- **`InboxNotifications`** (TypeORM entity `InboxNotification`, table `InboxNotifications`):
  - One row per **persisted notification** delivered to a **recipient** `userId` (same numeric id as `Users.id`; **no TypeORM `@ManyToOne` / DB FK** in the current entity—integrity is enforced in application code).
  - Used when the user may have been **offline** or **not connected to SSE**; complements live Redis → SSE delivery.
  - Columns: `eventType` (varchar 64), `payload` (jsonb, nullable), `readAt` (timestamptz, nullable = unread), `createdAt`.
  - Composite-style indexes: `(userId, readAt)`, `(userId, createdAt)` for inbox listing and unread queries.
  - **Not every SSE event is stored**: see `src/notification-service/notification-inbox-skip.constants.ts` (e.g. `friend.request.received` / `friend.request.sent` are skipped because `GET /user-service/friends/pending` is the source of truth for those).
  - HTTP API: `GET /notifications/inbox`, `PATCH /notifications/inbox/:id/read`, `POST /notifications/inbox/read-all` (see [Notification Service](./07-notification-service.md)).
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
    boolean isBot
    number gameCreatedAt
    number finishedAt
    string winnerColor
    string winnerId "userId nullable on draw"
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

- `GameSnapshot` has indexes on `white`, `black`, `finishedAt`, and `isBot+finishedAt`.
- `ProblemSnapshot` has an index on `userId` (for counts and user-scoped queries).
- `ProblemSnapshot` stores references as plain strings (`userId`, `problemId`), not Mongo ObjectId refs.
- PvP snapshot persistence is implemented.
- PvE snapshot persistence is implemented and flagged with `isBot: true`.

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

  INBOX_NOTIFICATIONS {
    int userId "postgres Users.id recipient"
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

  USERS ||..o{ INBOX_NOTIFICATIONS : "logical recipient userId"
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
- **Within Postgres**, `InboxNotifications.userId` is also a **logical** reference to `Users.id` (same pattern: no FK constraint on the inbox table in the current schema).
- This is a denormalized event/history approach:
  - Postgres = operational source of truth (and **inbox rows** for notification replay after login).
  - Mongo = historical snapshots/analytics store.
- Because links are logical, integrity depends on service code (not FK constraints).

