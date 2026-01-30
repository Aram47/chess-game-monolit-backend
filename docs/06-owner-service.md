# Owner Service Module

## Overview

The Owner Service module provides administrative endpoints for managing users, chess problems, and problem categories. It acts as a privileged service layer that delegates to UserService and GameServiceService, but with role-based access control (RBAC) to ensure only authorized administrators can perform these operations.

## Purpose

The Owner Service module:
- Provides admin-only endpoints for user management
- Allows creation and deletion of chess problems
- Manages problem categories
- Enforces role-based access control (RBAC)
- Acts as a facade for administrative operations

## Architecture

The module consists of:
- **OwnerServiceController**: HTTP REST API endpoints with RBAC guards
- **OwnerServiceService**: Business logic delegation
- **OwnerServiceModule**: Module configuration

### Dependencies

- **UserModule**: For user management operations
- **GameServiceModule**: For problem and category management
- **AuthGuard**: For authentication verification
- **RolesGuard**: For role-based authorization

### Security

All endpoints require:
1. **Authentication**: User must be authenticated (AuthGuard)
2. **Authorization**: User must have appropriate role (RolesGuard)

**Role Requirements:**
- **ADMIN**: Required for problem and category management
- **SUPER_ADMIN**: Required for user management

---

## Core Functionality

### User Management (Super Admin Only)

The Owner Service provides full user CRUD operations, but only for SUPER_ADMIN role:

#### Create User
- Creates new users with hashed passwords
- Delegates to `UserService.createUser()`
- Returns created user without password

#### Get User
- Retrieves user by ID
- Delegates to `UserService.getUserById()`
- Returns user with related data

#### Get Users
- Retrieves paginated list of users
- Delegates to `UserService.getUsers()`
- Supports sorting and pagination

#### Update User
- Updates user fields
- Delegates to `UserService.updateUserById()`
- Returns updated user

#### Delete User
- Deletes user and related data
- Delegates to `UserService.deleteUserById()`
- Returns deletion confirmation

---

### Problem Management (Admin Only)

The Owner Service provides problem CRUD operations for ADMIN role:

#### Create Chess Problem
- Creates new chess problem
- Validates category exists
- Delegates to `GameServiceService.createProblem()`
- Returns created problem

#### Delete Chess Problem
- Deletes problem by ID
- Delegates to `GameServiceService.deleteChessProblemById()`
- Returns deleted problem

---

### Category Management (Admin Only)

The Owner Service provides category CRUD operations for ADMIN role:

#### Create Problem Category
- Creates new problem category
- Delegates to `GameServiceService.createProblemCategory()`
- Returns created category

#### Delete Problem Category
- Deletes category by ID
- Delegates to `GameServiceService.deleteProblemCategoryById()`
- Returns deleted category

---

## API Endpoints

### User Management Endpoints (Super Admin Only)

#### POST `/owner-service/create_user`
Creates a new user.

**Authentication:** Required (AuthGuard)
**Authorization:** SUPER_ADMIN role required

**Request Body:**
```typescript
{
  name: string;
  surname: string;
  username: string;
  password: string;
  email: string;
}
```

**Response:**
- **Status:** 201 Created
- **Body:** Created user object (without password)

---

#### GET `/owner-service/get_user/:id`
Retrieves a user by ID.

**Authentication:** Required (AuthGuard)
**Authorization:** SUPER_ADMIN role required

**Path Parameters:**
- `id`: User ID (number)

**Response:**
- **Status:** 200 OK
- **Body:** User object with related data

---

#### GET `/owner-service/get_users`
Retrieves paginated list of users.

**Authentication:** Required (AuthGuard)
**Authorization:** SUPER_ADMIN role required

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}
```

**Response:**
- **Status:** 200 OK
- **Body:** Paginated user list with metadata

---

#### PATCH `/owner-service/update_user/:id`
Updates a user by ID.

**Authentication:** Required (AuthGuard)
**Authorization:** SUPER_ADMIN role required

**Path Parameters:**
- `id`: User ID (number)

**Request Body:**
```typescript
{
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
}
```

**Response:**
- **Status:** 200 OK
- **Body:** Updated user object

---

#### DELETE `/owner-service/delete_user/:id`
Deletes a user by ID.

**Authentication:** Required (AuthGuard)
**Authorization:** SUPER_ADMIN role required

**Path Parameters:**
- `id`: User ID (number)

**Response:**
- **Status:** 200 OK
- **Body:** Deletion confirmation with deleted user

---

### Problem Management Endpoints (Admin Only)

#### POST `/owner-service/create-chess-problem`
Creates a new chess problem.

**Authentication:** Required (AuthGuard)
**Authorization:** ADMIN role required

**Request Body:**
```typescript
{
  fen: string;
  solutionMoves: MoveType[];
  description: string;
  difficultyLevel: ProblemDifficultyLevel;
  isPayable: boolean;
  category: string;  // Category name
  isActive: boolean;
}
```

**Response:**
- **Status:** 201 Created
- **Body:** Created chess problem

---

#### DELETE `/owner-service/:id/delete-chess-problem`
Deletes a chess problem by ID.

**Authentication:** Required (AuthGuard)
**Authorization:** ADMIN role required

**Path Parameters:**
- `id`: Problem ID (number)

**Response:**
- **Status:** 200 OK
- **Body:** Deleted chess problem

---

### Category Management Endpoints (Admin Only)

#### POST `/owner-service/create-problem-category`
Creates a new problem category.

**Authentication:** Required (AuthGuard)
**Authorization:** ADMIN role required

**Request Body:**
```typescript
{
  name: string;
  description: string;
  isActive: boolean;
}
```

**Response:**
- **Status:** 201 Created
- **Body:** Created problem category

---

#### DELETE `/owner-service/:id/delete-problem-category`
Deletes a problem category by ID.

**Authentication:** Required (AuthGuard)
**Authorization:** ADMIN role required

**Path Parameters:**
- `id`: Category ID (number)

**Response:**
- **Status:** 200 OK
- **Body:** Deleted problem category

---

## Service Methods

### User Management Methods

#### `createUser(dto: CreateUserDto)`
Delegates to `UserService.createUser()`.

#### `getUserById(id: number)`
Delegates to `UserService.getUserById()`.

#### `getUsers(dto: PaginationDto)`
Delegates to `UserService.getUsers()`.

#### `updateUserById(id: number, dto: UpdateUserDto)`
Delegates to `UserService.updateUserById()`.

#### `deleteUserById(id: number)`
Delegates to `UserService.deleteUserById()`.

---

### Problem Management Methods

#### `createChessProblem(dto: CreateProblemDto)`
Delegates to `GameServiceService.createProblem()`.

#### `deleteChessProblemById(id: number)`
Delegates to `GameServiceService.deleteChessProblemById()`.

---

### Category Management Methods

#### `createProblemCategory(dto: CreateProblemCategoryDto)`
Delegates to `GameServiceService.createProblemCategory()`.

#### `deleteProblemCategoryById(id: number)`
Delegates to `GameServiceService.deleteProblemCategoryById()`.

---

## Role-Based Access Control

### Role Hierarchy

The service uses role-based access control with the following roles:

1. **SUPER_ADMIN**: Highest privilege level
   - Can manage users (create, read, update, delete)
   - Can manage problems and categories

2. **ADMIN**: Administrative level
   - Can manage problems and categories
   - Cannot manage users

3. **USER**: Regular user level
   - Cannot access Owner Service endpoints

### Guard Implementation

**AuthGuard:**
- Verifies JWT token validity
- Extracts user information from token
- Attaches user data to request

**RolesGuard:**
- Checks user role from token payload
- Compares with required role for endpoint
- Throws `ForbiddenException` if role insufficient

---

## Security Considerations

1. **Role Verification**: All endpoints verify user role before execution
2. **Token Validation**: JWT tokens are validated on every request
3. **Delegation Pattern**: Service delegates to underlying services (separation of concerns)
4. **Audit Logging**: Consider adding audit logs for admin operations
5. **Rate Limiting**: Consider rate limiting for admin endpoints

## Error Handling

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient role permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (e.g., email/username)
- **500 Internal Server Error**: Server-side errors

## Integration Points

- **UserService**: All user management operations
- **GameServiceService**: All problem and category operations
- **AuthGuard**: Authentication verification
- **RolesGuard**: Authorization verification

## Use Cases

1. **User Administration**: Super admins can manage user accounts
2. **Content Management**: Admins can create and manage chess problems
3. **Category Management**: Admins can organize problems into categories
4. **System Maintenance**: Administrative operations for system upkeep

## Future Improvements

1. **Audit Logging**: Log all admin operations with timestamps and user info
2. **Bulk Operations**: Support bulk user/problem operations
3. **Soft Delete**: Implement soft delete for users and problems
4. **Role Management**: Allow admins to manage user roles
5. **Permission Granularity**: More granular permissions beyond roles
6. **Admin Dashboard**: Web interface for administrative operations
7. **Operation History**: Track changes made by admins
