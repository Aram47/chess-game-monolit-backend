# API Gateway Module

## Overview

The API Gateway module serves as the main entry point for all HTTP REST API requests in the chess game application. It acts as a facade that routes requests to appropriate internal services, providing a unified interface for client applications.

## Purpose

The API Gateway module:
- Centralizes **public** authentication endpoints (register, login, refresh, logout)
- Handles token management (login, logout, refresh)
- Delegates registration to `UserService` and auth flows to `AuthService`
- Manages HTTP cookies for token storage

**User listing, arbitrary user get/update/delete by id** are **not** exposed on `/api`. Admins use **Owner Service** (`/owner-service/...`) with `AuthGuard` + `RolesGuard` (e.g. `SUPER_ADMIN`).

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

### User administration (not on API Gateway)

Cross-user and directory operations are implemented on **Owner Service** only. See `docs/06-owner-service.md` for endpoints such as `GET /owner-service/get_users`, `GET /owner-service/get_user/:id`, `PATCH /owner-service/update_user/:id`, `DELETE /owner-service/delete_user/:id` (all require appropriate admin roles).

Authenticated **self-service** profile APIs (e.g. `GET /api/me`) may be added later on the gateway with `AuthGuard` and JWT `sub` scoping.

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
- **UserService**: Used for **registration** (`createUser`) only on this module
- **Database**: PostgreSQL for user data persistence
