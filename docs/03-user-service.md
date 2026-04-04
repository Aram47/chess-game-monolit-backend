# User Service Module

## Overview

The User Service module handles all user-related data operations, including user creation, retrieval, updates, and deletion. It manages the relationship between users and their related data (roles, plans, statistics) using PostgreSQL database.

## Purpose

The User Service module:
- Manages user CRUD operations
- Handles user authentication data (password hashing)
- Manages user-related data (roles, plans, XP, level, ELO)
- Exposes authenticated **profile** and **friends** HTTP APIs (`/user-service`)
- Composes profile stats from Mongo snapshots (solved puzzles, game W/L/D, recent games)
- Provides user data retrieval with proper joins
- Ensures data integrity through transactions

## Architecture

The module consists of:
- **UserService**: Core user business logic and data access (including `createOAuthUser`, `changePasswordForUser`, `getProfileAuthFlags`)
- **UserProfileService**: Builds profile payloads (Postgres user + Mongo aggregates via `SnapshotServiceService`)
- **UserFriendService**: Friend requests and friendships (`UserFriends` table, one row per user pair)
- **UserController**: Authenticated routes under `user-service`
- **UserModule**: TypeORM entities + imports `SnapshotServiceModule` for aggregates + `NotificationsModule` for friend-related SSE (via `NotificationsPublisherService`)

### Dependencies

- **TypeORM**: For database operations
- **PostgreSQL**: Database for user persistence
- **bcrypt**: For password hashing
- **SnapshotServiceModule**: Mongo counts and game stats for profiles

### Database Entities

- **User**: Main user entity with basic information
- **UserRelatedData**: Related user data (roles, plan, xp, level, **elo**)
- **UserFriend**: Friendship row between two users (canonical `userId` < `friendId`, single row per pair)

## Core Functionality

### User Creation

The `createUser()` method performs the following steps:

1. **Password Hashing**: Hashes the password using bcrypt (10 rounds)
2. **Transaction Management**: Creates user and related data in a database transaction
3. **Data Sanitization**: Removes password from response
4. **Error Handling**: Handles unique constraint violations (email/username)

**Transaction Flow:**
- Creates User entity with hashed password
- Creates UserRelatedData entity with default values
- Both operations are atomic (all or nothing)

---

### User Retrieval

The service provides multiple methods for retrieving users:

#### `getUserById(id: number)`
- Retrieves user with joined `userRelatedData`
- Throws `NotFoundException` if user doesn't exist
- Returns complete user object

#### `getUserByLoginWithPassword(login: string)`
- Retrieves user by email or username
- **Includes password field** (normally excluded)
- Used for authentication purposes only
- Case-insensitive email matching
- Exact username matching

#### `getUsers(dto: PaginationDto)`
- Retrieves paginated list of users
- Supports sorting by any field
- Supports ascending/descending order
- Returns users with joined `userRelatedData`
- Includes pagination metadata

---

### User Updates

The `updateUserById()` method (admin / owner flows):
- Updates user fields using TypeORM query builder
- Returns updated user data
- Validates user existence
- Uses `RETURNING` clause for immediate feedback

**Supported Fields:** any fields on `UpdateUserDto` (partial registration shape; includes optional password).

The `updateUserProfile()` method (self-service):
- Updates only **name**, **surname**, **username**, **email** from `UpdateProfileDto`
- Maps unique violations to `409 Conflict` (email/username)

---

### User Deletion

The `deleteUserById()` method:
- Deletes user using TypeORM query builder
- Uses `RETURNING` clause to get deleted user
- Cascades deletion to `UserRelatedData` (via FK constraint)
- Returns deletion confirmation with deleted user data

**Cascade Behavior:**
- `UserRelatedData` is automatically deleted due to `onDelete: 'CASCADE'` constraint

---

## API Methods

### `createUser(dto: CreateUserDto)`

Creates a new user with hashed password.

**Parameters:**
```typescript
{
  name: string;           // 2-50 characters
  surname: string;         // 2-50 characters
  username: string;        // 3-20 characters, unique
  password: string;        // 8-30 characters, strong password
  email: string;           // Valid email format, unique
}
```

**Returns:**
- User object (without password)

**Throws:**
- `ConflictException`: If email or username already exists (PostgreSQL error code 23505)

---

### `getUserById(id: number)`

Retrieves a user by ID with related data.

**Parameters:**
- `id`: User ID (number)

**Returns:**
- User object with `userRelatedData` joined

**Throws:**
- `NotFoundException`: If user doesn't exist

---

### `getUserByLoginWithPassword(login: string)`

Retrieves user by email or username including password.

**Parameters:**
- `login`: Email or username (string)

**Returns:**
- User object with password field included

**Note:** This method is used internally by AuthService for authentication. The password field is normally excluded from queries.

---

### `getUsers(dto: PaginationDto)`

Retrieves paginated list of users.

**Parameters:**
```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 10
  sortBy?: string;         // Default: 'id'
  sortDir?: 'ASC' | 'DESC'; // Default: 'DESC'
}
```

**Returns:**
```typescript
{
  users: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

---

### `updateUserById(id: number, dto: UpdateUserDto)`

Updates user fields.

**Parameters:**
- `id`: User ID (number)
- `dto`: Partial user data (all fields optional)

**Returns:**
- Updated user object (without password)

**Throws:**
- `NotFoundException`: If user doesn't exist

---

### `deleteUserById(id: number)`

Deletes a user and related data.

**Parameters:**
- `id`: User ID (number)

**Returns:**
```typescript
{
  deleted: true;
  deletedUser: User;  // Without password
}
```

**Throws:**
- `NotFoundException`: If user doesn't exist

---

### `toUserResponse(user: User)`

Utility method to sanitize user data.

**Parameters:**
- `user`: User object (may include password)

**Returns:**
- User object without password field

---

## HTTP API (`UserController`, `AuthGuard` required)

Base path: **`/user-service`**. Uses the same auth mechanism as other guarded routes (e.g. JWT / cookies per `AuthGuard`).

### Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user-service/profile/me` | Current user profile including **email**, **authProvider**, **canChangePassword**, **elo**, stats, **recentGames** |
| PATCH | `/user-service/profile/me` | Update profile (`UpdateProfileDto`: optional name, surname, username, email) |
| PATCH | `/user-service/profile/me/password` | Change password (`ChangePasswordDto`: `currentPassword`, `newPassword`). **403** if Google-only; **400** if current password wrong |
| GET | `/user-service/profile/:userId` | Public profile for another user (**no email**, no auth flags); same stats and recent games |
| GET | `/user-service/users/search?q=&limit=` | Directory search (authenticated): if `q` is all digits, lookup by **user id**; otherwise **partial** match on username, first name, or surname (**min 2** characters after stripping `%` / `_`). Returns `id`, `username`, `name`, `surname`, `elo` only (no email). `limit` 1–20, default 10 |

**Stats** are derived at read time from Mongo:
- **solvedProblemsCount** — count of `ProblemSnapshot` documents for the user id (string)
- **playedGames**, **wins**, **losses**, **draws** — aggregation over `GameSnapshot` where the user is `white` or `black`

**ELO** is stored on `UserRelatedData.elo`. Rating **calculation** is not implemented yet; only persistence and API exposure.

**Auth flags (GET `/profile/me` only):** `authProvider` is `local` or `google`. `canChangePassword` is true only for local accounts that have a stored password; the frontend should hide the change-password form when false.

### Friends (`UserFriends`)

One row per unordered pair: `userId` < `friendId`, with `status` (`pending` | `accepted` | `rejected`) and `requestedBy`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user-service/friends/request` | Body **`friendId`** (number) **or** **`username`** (exact match, 3–20 chars; optional leading `@` trimmed) — exactly one required. Creates pending or reopens from rejected |
| PATCH | `/user-service/friends/:id/accept` | Recipient accepts pending request |
| PATCH | `/user-service/friends/:id/reject` | Recipient rejects pending request |
| DELETE | `/user-service/friends/:id` | Unfriend (accepted), cancel outgoing pending, or remove a rejected row |
| GET | `/user-service/friends` | Accepted friends with counterparty snippet |
| GET | `/user-service/friends/pending` | `{ incoming, outgoing }` pending lists |

**Offline / login:** Clients should call `GET /user-service/friends/pending` and `GET /user-service/friends` after login so incoming requests and accepted friends match the database (SSE alone does not replay history). Other social events are stored in `GET /notifications/inbox` when the user was offline. See `docs/07-notification-service.md`.

---

## Data Models

### User Entity
```typescript
{
  id: number;
  email: string;          // Unique
  username: string;       // Unique
  name: string;
  surname: string;
  password: string | null; // Bcrypt for local; null for Google-only sign-up
  authProvider: 'local' | 'google';
  userRelatedData: UserRelatedData;
  createdAt: Date;
  updatedAt: Date;
}
```

### UserRelatedData Entity
```typescript
{
  id: number;
  userId: number;         // Foreign key to User (join column on this table)
  role: Role;             // ADMIN, USER, SUPER_ADMIN
  plan: Plan;             // FREE, PREMIUM, etc.
  xp: number;             // Experience points
  level: number;          // User level
  elo: number;            // Rating (default 1500); calculation updated separately
  createdAt: Date;
  updatedAt: Date;
}
```

Puzzle/game win-loss counts are **not** duplicated here; they come from Mongo snapshots when serving profiles.

### UserFriend Entity
```typescript
{
  id: number;
  userId: number;         // Always the smaller User.id in the pair (FK)
  friendId: number;       // Always the larger User.id in the pair (FK)
  status: 'pending' | 'accepted' | 'rejected';
  requestedBy: number;    // Must equal userId or friendId
  createdAt: Date;
}
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt (10 rounds)
2. **Password Exclusion**: Passwords are excluded from queries by default
3. **Unique Constraints**: Email and username must be unique
4. **Transaction Safety**: User creation uses transactions for data integrity

## Error Handling

- **404 Not Found**: User doesn't exist
- **409 Conflict**: Email or username already exists
- **Database Errors**: Propagated with appropriate error codes

## Query Optimization

- Uses TypeORM QueryBuilder for efficient queries
- Implements proper joins to avoid N+1 queries
- Uses `skip` and `take` for pagination
- Supports dynamic sorting

## Integration Points

- **AuthService**: Uses `getUserByLoginWithPassword()` for authentication
- **ApiGatewayService**: Uses `createUser()` for **registration** only (public `POST /api/register`)
- **OwnerServiceService**: Uses user CRUD for **admin** operations (`SUPER_ADMIN` routes under `/owner-service`)
- **SnapshotServiceService**: Supplies Mongo aggregates for profile stats (`countSolvedProblems`, `getUserGameStats`, `getRecentGames`)
- **Database**: PostgreSQL with TypeORM for user/friend persistence; **`InboxNotifications`** (notification module) stores cross-cutting alerts by recipient `userId`; Mongo for historical game/puzzle snapshots (see [Database ERDs](./11-erd-databases.md))

## Future Improvements

1. **Soft Delete**: Implement soft delete instead of hard delete
2. **User Search**: Add full-text search capabilities
3. **User Filtering**: Add advanced filtering options
4. **Audit Logging**: Track user data changes
5. **Email Verification**: Add email verification workflow
