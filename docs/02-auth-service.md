# Auth Service Module

## Overview

The Auth Service module handles all authentication-related business logic, including user login, token generation, token refresh, and logout operations. It works in conjunction with the User Service to validate credentials and manage JWT tokens.

## Purpose

The Auth Service module:
- Validates user credentials during login
- Generates JWT access and refresh tokens
- Refreshes expired access tokens using refresh tokens
- Handles logout operations
- Manages token expiration and validation

## Architecture

The module consists of:
- **AuthService**: Core authentication business logic
- **AuthModule**: Module configuration and dependencies

### Dependencies

- `UserModule`: For user data retrieval and validation
- `JwtUtils`: For JWT token generation and verification (from CommonModule)
- `ConfigService`: For accessing environment variables

## Core Functionality

### Login Process

The `login()` method performs the following steps:

1. **Credential Retrieval**: Fetches user by login (email or username) including password hash
2. **Password Verification**: Compares provided password with stored hash using bcrypt
3. **Token Generation**: Creates JWT access and refresh tokens with user payload
4. **Response Preparation**: Returns tokens and sanitized user data (without password)

**Token Payload Structure:**
```typescript
{
  sub: number;        // User ID
  email: string;      // User email
  role: string;       // User role from userRelatedData
}
```

**Token Configuration:**
- Access token expiration: From `JWT_EXPIRES_IN` environment variable
- Refresh token expiration: From `JWT_REFRESH_EXPIRES_IN` environment variable
- Access token secret: From `JWT_SECRET` environment variable
- Refresh token secret: From `JWT_REFRESH_SECRET` environment variable

---

### Token Refresh Process

The `refresh()` method performs the following steps:

1. **Token Verification**: Validates the refresh token using the refresh secret
2. **User Retrieval**: Fetches user by ID from token payload
3. **Token Regeneration**: Creates new access and refresh token pair
4. **Response**: Returns new token pair

**Security Considerations:**
- Refresh tokens are validated against a separate secret
- User existence is verified before token regeneration
- New tokens are generated with current user data (role may have changed)

---

### Logout Process

The `logout()` method performs the following steps:

1. **Token Validation**: Verifies the access token
2. **Logout Confirmation**: Returns success status

**Note:** Currently, token blacklisting is not implemented. In a production environment, you should:
- Store blacklisted tokens in Redis
- Check token blacklist on each authenticated request
- Set appropriate expiration for blacklist entries

---

## API Methods

### `login(dto: LoginDto)`

Authenticates a user and generates tokens.

**Parameters:**
- `dto`: LoginDto containing `login` (email/username) and `password`

**Returns:**
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: User;  // Without password field
}
```

**Throws:**
- `UnauthorizedException`: If credentials are invalid

---

### `refresh(refreshToken: string)`

Refreshes access and refresh tokens.

**Parameters:**
- `refreshToken`: JWT refresh token string

**Returns:**
```typescript
{
  newAccessToken: string;
  newRefreshToken: string;
}
```

**Throws:**
- `UnauthorizedException`: If refresh token is invalid or user not found

---

### `logout(accessToken: string)`

Handles user logout.

**Parameters:**
- `accessToken`: JWT access token string

**Returns:**
- `boolean`: True if logout successful

**Throws:**
- `UnauthorizedException`: If access token is invalid

---

## Security Features

1. **Password Hashing**: Uses bcrypt for secure password comparison
2. **Token Secrets**: Separate secrets for access and refresh tokens
3. **Token Expiration**: Configurable expiration times via environment variables
4. **User Validation**: Verifies user existence before token operations

## Environment Variables

The service requires the following environment variables:

- `JWT_SECRET`: Secret key for access token signing
- `JWT_REFRESH_SECRET`: Secret key for refresh token signing
- `JWT_EXPIRES_IN`: Access token expiration time (e.g., "15m", "1h")
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration time (e.g., "7d", "30d")

## Error Handling

- **Invalid Credentials**: Returns `UnauthorizedException` with generic message
- **Invalid Token**: Returns `UnauthorizedException` when token verification fails
- **User Not Found**: Returns `UnauthorizedException` when user doesn't exist

## Integration Points

- **UserService**: 
  - `getUserByLoginWithPassword()`: Retrieves user with password for login
  - `getUserById()`: Retrieves user for token refresh
  - `toUserResponse()`: Sanitizes user data (removes password)

- **JwtUtils** (from CommonModule):
  - `generateToken()`: Creates access tokens
  - `generateRefreshToken()`: Creates refresh tokens
  - `verifyToken()`: Validates token signatures

## Future Improvements

1. **Token Blacklisting**: Implement Redis-based token blacklist for logout
2. **Rate Limiting**: Add rate limiting for login attempts
3. **Multi-Factor Authentication**: Support for 2FA/MFA
4. **Session Management**: Track active sessions per user
5. **Password Reset**: Implement password reset functionality
