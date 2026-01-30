# API Gateway Module

## Overview

The API Gateway module serves as the main entry point for all HTTP REST API requests in the chess game application. It acts as a facade that routes requests to appropriate internal services, providing a unified interface for client applications.

## Purpose

The API Gateway module:
- Centralizes authentication and authorization endpoints
- Provides a single point of entry for user management operations
- Handles token management (login, logout, refresh)
- Routes requests to appropriate backend services (UserService, AuthService)
- Manages HTTP cookies for token storage

## Architecture

The module consists of:
- **ApiGatewayController**: Handles HTTP requests and responses
- **ApiGatewayService**: Business logic and service orchestration
- **ApiGatewayModule**: Module configuration and dependencies

### Dependencies

- `AuthModule`: For authentication operations
- `UserModule`: For user management operations
- `GameServiceModule`: For game-related operations
- `OwnerServiceModule`: For owner/admin operations
- `SnapshotServiceModule`: For snapshot operations

## API Endpoints

### Authentication Endpoints

#### POST `/api/login`
User login endpoint that authenticates users and returns JWT tokens.

**Request Body:**
```typescript
{
  login: string;      // Email or username
  password: string;    // User password
}
```

**Response:**
- **Status:** 200 OK
- **Body:** User object (without password)
- **Cookies:** 
  - `accessToken`: HTTP-only cookie with JWT access token
  - `refreshToken`: HTTP-only cookie with JWT refresh token

**Flow:**
1. Validates user credentials via `AuthService.login()`
2. Generates access and refresh tokens
3. Sets HTTP-only cookies for token storage
4. Returns user information

---

#### POST `/api/register`
User registration endpoint.

**Request Body:**
```typescript
{
  name: string;
  surname: string;
  username: string;
  password: string;    // Must be strong password (min 8 chars)
  email: string;       // Valid email format
}
```

**Response:**
- **Status:** 201 Created
- **Body:** Created user object (without password)

**Flow:**
1. Delegates to `UserService.createUser()`
2. Hashes password using bcrypt
3. Creates user and related data in database transaction
4. Returns created user

---

#### POST `/api/refresh`
Refreshes access and refresh tokens.

**Request:**
- **Cookies:** `refreshToken` (required)

**Response:**
- **Status:** 200 OK
- **Body:** `{ message: 'Tokens refreshed successfully' }`
- **Cookies:** 
  - `accessToken`: New access token
  - `refreshToken`: New refresh token

**Flow:**
1. Extracts refresh token from cookies
2. Validates refresh token via `AuthService.refresh()`
3. Generates new token pair
4. Updates cookies with new tokens

---

#### POST `/api/logout`
User logout endpoint.

**Request:**
- **Cookies:** `accessToken` (required)

**Response:**
- **Status:** 200 OK
- **Body:** `{ message: 'Logged out successfully' }`
- **Cookies:** Clears `accessToken` and `refreshToken`

**Flow:**
1. Extracts access token from cookies
2. Validates token via `AuthService.logout()`
3. Clears authentication cookies
4. Returns success message

---

### User Management Endpoints

#### GET `/api`
Retrieves a paginated list of users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: 'id')
- `sortDir`: Sort direction - 'ASC' or 'DESC' (default: 'DESC')

**Response:**
- **Status:** 200 OK
- **Body:** 
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

**Flow:**
1. Parses pagination parameters
2. Delegates to `UserService.getUsers()`
3. Returns paginated user list with metadata

---

#### GET `/api/:id`
Retrieves a user by ID.

**Path Parameters:**
- `id`: User ID (number)

**Response:**
- **Status:** 200 OK
- **Body:** User object with related data

**Flow:**
1. Extracts user ID from path
2. Delegates to `UserService.getUserById()`
3. Returns user with joined `userRelatedData`

---

#### PATCH `/api/:id`
Updates a user by ID.

**Path Parameters:**
- `id`: User ID (number)

**Request Body:**
```typescript
{
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
  // All fields are optional
}
```

**Response:**
- **Status:** 200 OK
- **Body:** Updated user object (without password)

**Flow:**
1. Extracts user ID and update data
2. Delegates to `UserService.updateUserById()`
3. Returns updated user

---

#### DELETE `/api/:id`
Deletes a user by ID.

**Path Parameters:**
- `id`: User ID (number)

**Response:**
- **Status:** 200 OK
- **Body:** 
```typescript
{
  deleted: true;
  deletedUser: User;
}
```

**Flow:**
1. Extracts user ID from path
2. Delegates to `UserService.deleteUserById()`
3. Cascades deletion of related data
4. Returns deletion confirmation

---

## Security Considerations

1. **Token Storage**: Tokens are stored in HTTP-only cookies to prevent XSS attacks
2. **Cookie Security**: Cookies use `secure: true` and `sameSite: 'strict'` flags
3. **Password Handling**: Passwords are never returned in API responses
4. **Error Handling**: Authentication errors return generic messages to prevent user enumeration

## Error Responses

- **401 Unauthorized**: Invalid credentials or expired token
- **404 Not Found**: User not found
- **409 Conflict**: Email or username already exists
- **500 Internal Server Error**: Server-side errors

## Integration Points

- **AuthService**: Handles authentication logic and token generation
- **UserService**: Manages user CRUD operations
- **Database**: PostgreSQL for user data persistence
