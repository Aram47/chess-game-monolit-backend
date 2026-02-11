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
- Enforces RBAC and ownership rules on protected endpoints

## Architecture

The module consists of:
- **ApiGatewayController**: Handles HTTP requests and responses
- **ApiGatewayService**: Business logic and service orchestration
- **ApiGatewayModule**: Module configuration and dependencies

### Dependencies

- `AuthModule`: For authentication operations
- `UserModule`: For user management operations

## API Endpoints

### Authentication Endpoints (public)

#### POST `/api/login`
User login endpoint that authenticates users and returns JWT tokens.

**Auth:** None (public)

**Request Body:**
```typescript
{
  login: string;      // Email or username (3–255 chars)
  password: string;   // User password (8–200 chars)
}
```

**Response:**
- **Status:** 200 OK
- **Body:** User object (without password)
- **Cookies:** 
  - `accessToken`: HTTP-only, secure, sameSite=strict
  - `refreshToken`: HTTP-only, secure, sameSite=strict

**Error Responses:**
- **401 Unauthorized**: Invalid credentials

---

#### POST `/api/register`
User registration endpoint.

**Auth:** None (public)

**Request Body:**
```typescript
{
  name: string;       // 2–50 chars
  surname: string;    // 2–50 chars
  username: string;   // 3–20 chars, unique
  password: string;   // 8–30 chars, must be strong password
  email: string;      // Valid email format, unique
}
```

**Response:**
- **Status:** 201 Created
- **Body:** Created user object (without password)

**Error Responses:**
- **409 Conflict**: Email or username already exists

---

#### POST `/api/refresh`
Refreshes access and refresh tokens.

**Auth:** None (public, requires `refreshToken` cookie)

**Request:**
- **Cookies:** `refreshToken` (required)

**Response:**
- **Status:** 200 OK
- **Body:** `{ message: 'Tokens refreshed successfully' }`
- **Cookies:** New `accessToken` and `refreshToken`

**Error Responses:**
- **400 Bad Request**: Refresh token cookie is missing
- **401 Unauthorized**: Invalid or expired refresh token

---

#### POST `/api/logout`
User logout endpoint.

**Auth:** None (public, clears cookies regardless)

**Request:**
- **Cookies:** `accessToken` (optional — if present, verified before clearing)

**Response:**
- **Status:** 200 OK
- **Body:** `{ message: 'Logged out successfully' }`
- **Cookies:** Clears `accessToken` and `refreshToken`

> **Note:** Logout currently clears cookies on the client side. Token blacklisting is not implemented — tokens remain valid until expiry.

---

### User Management Endpoints (protected)

#### GET `/api`
Retrieves a paginated list of users.

**Auth:** `AuthGuard` (requires valid `accessToken` cookie)

**Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, min: 10, max: 100)
- `sortBy`: Field to sort by — `id` or `createdAt` (default: `id`)
- `sortDir`: Sort direction — `ASC` or `DESC` (default: `DESC`)

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

**Error Responses:**
- **401 Unauthorized**: Missing or invalid access token

---

#### GET `/api/:id`
Retrieves a user by ID.

**Auth:** `AuthGuard` (requires valid `accessToken` cookie)

**Path Parameters:**
- `id`: User ID (positive integer, validated via `ParseIntPipe`)

**Response:**
- **Status:** 200 OK
- **Body:** User object with related data

**Error Responses:**
- **401 Unauthorized**: Missing or invalid access token
- **404 Not Found**: User not found

---

#### PATCH `/api/:id`
Updates a user by ID.

**Auth:** `AuthGuard` (requires valid `accessToken` cookie)  
**Authorization:** Users can only update their own profile. Admins (`ADMIN`, `SUPER_ADMIN`) can update any user.

**Path Parameters:**
- `id`: User ID (positive integer, validated via `ParseIntPipe`)

**Request Body:**
```typescript
{
  name?: string;       // 2–50 chars
  surname?: string;    // 2–50 chars
  username?: string;   // 3–20 chars, unique
  password?: string;   // 8–30 chars, strong password — will be bcrypt-hashed before storage
  email?: string;      // Valid email format, unique
}
```

**Response:**
- **Status:** 200 OK
- **Body:** Updated user object (without password)

**Error Responses:**
- **401 Unauthorized**: Missing or invalid access token
- **403 Forbidden**: Cannot update another user's profile (non-admin)
- **404 Not Found**: User not found
- **409 Conflict**: Email or username already exists

---

#### DELETE `/api/:id`
Deletes a user by ID.

**Auth:** `AuthGuard` + `RolesGuard`  
**Authorization:** `ADMIN` or `SUPER_ADMIN` role required.

**Path Parameters:**
- `id`: User ID (positive integer, validated via `ParseIntPipe`)

**Response:**
- **Status:** 200 OK
- **Body:** 
```typescript
{
  deleted: true;
  deletedUser: User;  // without password
}
```

**Error Responses:**
- **401 Unauthorized**: Missing or invalid access token
- **403 Forbidden**: Insufficient role
- **404 Not Found**: User not found

---

## Security Considerations

1. **Authentication**: All user management endpoints require a valid `accessToken` cookie (enforced by `AuthGuard`)
2. **Authorization**: Delete requires `ADMIN`/`SUPER_ADMIN` role; Update enforces ownership (or admin override)
3. **Token Storage**: Tokens are stored in HTTP-only cookies to prevent XSS attacks
4. **Cookie Security**: Cookies use `secure: true` and `sameSite: 'strict'` flags
5. **Password Handling**: Passwords are never returned in API responses; updates are bcrypt-hashed
6. **Input Validation**: `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` + `transform` is enabled globally
7. **Error Handling**: Authentication errors return generic messages to prevent user enumeration
8. **Path Params**: `:id` is validated via `ParseIntPipe` — non-integer values return 400

## Known Limitations / TODO

- **Token Blacklisting**: Logout does not invalidate tokens server-side — tokens are valid until expiry
- **Refresh Token Rotation**: Refresh tokens are not tracked server-side — no family-based revocation
- **Rate Limiting**: No rate limiting on login/register — vulnerable to brute-force attacks
- **CORS**: Currently configured with `origin: true` (reflects any origin) — should be restricted to allowed origins

## Error Responses Summary

- **400 Bad Request**: Invalid input / missing required cookie
- **401 Unauthorized**: Invalid credentials or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: User not found
- **409 Conflict**: Email or username already exists

## Integration Points

- **AuthService**: Handles authentication logic and token generation
- **UserService**: Manages user CRUD operations
- **Database**: PostgreSQL for user data persistence
