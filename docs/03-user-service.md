# User Service Module

## Overview

The User Service module handles all user-related data operations, including user creation, retrieval, updates, and deletion. It manages the relationship between users and their related data (roles, plans, statistics) using PostgreSQL database.

## Purpose

The User Service module:
- Manages user CRUD operations
- Handles user authentication data (password hashing)
- Manages user-related data (roles, plans, XP, statistics)
- Provides user data retrieval with proper joins
- Ensures data integrity through transactions

## Architecture

The module consists of:
- **UserService**: Core user business logic and data access
- **UserModule**: Module configuration with TypeORM entities

### Dependencies

- **TypeORM**: For database operations
- **PostgreSQL**: Database for user persistence
- **bcrypt**: For password hashing

### Database Entities

- **User**: Main user entity with basic information
- **UserRelatedData**: Related user data (roles, plans, statistics)

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

The `updateUserById()` method:
- Updates user fields using TypeORM query builder
- Returns updated user data
- Validates user existence
- Uses `RETURNING` clause for immediate feedback

**Supported Fields:**
- `name`
- `surname`
- `username`
- `email`
- Any other User entity fields

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

## Data Models

### User Entity
```typescript
{
  id: number;
  email: string;          // Unique
  username: string;       // Unique
  name: string;
  surname: string;
  password: string;       // Hashed, excluded from queries by default
  userRelatedData: UserRelatedData;
  createdAt: Date;
  updatedAt: Date;
}
```

### UserRelatedData Entity
```typescript
{
  id: number;
  userId: number;         // Foreign key to User
  role: Role;             // ADMIN, USER, SUPER_ADMIN
  plan: Plan;             // FREE, PREMIUM, etc.
  xp: number;             // Experience points
  level: number;          // User level (0-100)
  solvedProblems: number; // Count of solved problems
  winGames: number;       // Count of won games
  loseGames: number;      // Count of lost games
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
- **ApiGatewayService**: Uses all CRUD methods for user management
- **OwnerService**: Uses user methods for admin operations
- **Database**: PostgreSQL with TypeORM for data persistence

## Future Improvements

1. **Soft Delete**: Implement soft delete instead of hard delete
2. **User Search**: Add full-text search capabilities
3. **User Filtering**: Add advanced filtering options
4. **Audit Logging**: Track user data changes
5. **Email Verification**: Add email verification workflow
