# Chess Game Monolith Backend - Module Documentation

This directory contains comprehensive documentation for all modules in the Chess Game Monolith Backend application.

## Documentation Index

### Core Services

1. **[API Gateway](./01-api-gateway.md)** - Main entry point for HTTP REST API requests
   - Authentication endpoints (login, register, logout, refresh)
   - User management endpoints
   - Request routing and orchestration

2. **[Auth Service](./02-auth-service.md)** - Authentication and authorization
   - JWT token generation and validation
   - Password hashing and verification
   - Token refresh mechanism

3. **[User Service](./03-user-service.md)** - User data management
   - User CRUD operations
   - Password management
   - User-related data (roles, plans, statistics)

### Game Services

4. **[Game Service](./04-game-service.md)** - Core game logic
   - Chess problem management
   - Problem-solving sessions
   - Player vs Bot (PvE) games
   - Move validation

5. **[Game Engine](./05-game-engine.md)** - Chess engine integration
   - Stockfish engine pool management
   - Bot move calculation
   - Difficulty levels
   - Engine lifecycle management

6. **[Socket Service](./09-socket-service.md)** - Real-time game communication
   - WebSocket-based PvP games
   - Matchmaking system
   - Game state synchronization
   - Reconnection handling

### Administrative Services

7. **[Owner Service](./06-owner-service.md)** - Administrative operations
   - User management (Super Admin)
   - Problem and category management (Admin)
   - Role-based access control

### Supporting Services

8. **[Notification Service](./07-notification-service.md)** - Real-time notifications
   - Server-Sent Events (SSE)
   - Redis pub/sub integration
   - Connection management

9. **[Snapshot Service](./08-snapshot-service.md)** - Game and problem history
   - Problem-solving snapshots
   - Game result storage
   - MongoDB persistence

---

## Architecture Overview

The application follows a modular monolith architecture with the following layers:

### Entry Layer
- **API Gateway**: HTTP REST API endpoints
- **Socket Service**: WebSocket endpoints

### Business Logic Layer
- **Auth Service**: Authentication logic
- **User Service**: User management logic
- **Game Service**: Game and problem logic
- **Game Engine**: Chess engine integration
- **Owner Service**: Administrative logic

### Infrastructure Layer
- **Notification Service**: Real-time communication
- **Snapshot Service**: Data persistence

### Data Storage
- **PostgreSQL**: User data, problems, categories
- **MongoDB**: Game and problem snapshots
- **Redis**: Sessions, game state, pub/sub

---

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (TypeORM), MongoDB (Mongoose)
- **Cache/Pub-Sub**: Redis
- **WebSocket**: Socket.IO
- **Chess Engine**: Stockfish
- **Chess Logic**: chess.js
- **Authentication**: JWT

---

## Module Dependencies

```
API Gateway
├── Auth Service
├── User Service
├── Game Service
│   ├── Game Engine
│   └── Snapshot Service
├── Owner Service
│   ├── User Service
│   └── Game Service
└── Socket Service
    └── Snapshot Service
```

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- MongoDB
- Redis
- Stockfish binary (in PATH)

### Environment Variables

Required environment variables are documented in each module's documentation. Common variables include:

- Database connection strings
- JWT secrets and expiration times
- Redis connection details
- MongoDB connection details

### Running the Application

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.{NODE_ENV}`

3. Start the application:
```bash
npm run start:dev
```

4. Access Swagger documentation (development only):
```
http://localhost:3000/swagger
```

---

## API Documentation

### REST API

All REST API endpoints are documented with Swagger metadata. Access the Swagger UI at `/swagger` in development mode.

### WebSocket API

WebSocket events and their payloads are documented in the [Socket Service](./09-socket-service.md) documentation.

### SSE API

Server-Sent Events are documented in the [Notification Service](./07-notification-service.md) documentation.

---

## Security

### Authentication

- JWT-based authentication
- Access tokens and refresh tokens
- HTTP-only cookies for token storage
- Token expiration and refresh mechanism

### Authorization

- Role-based access control (RBAC)
- Role hierarchy: SUPER_ADMIN > ADMIN > USER
- Guards on protected endpoints

### Data Security

- Password hashing with bcrypt
- Input validation
- SQL injection prevention (TypeORM)
- XSS prevention (HTTP-only cookies)

---

## Development Guidelines

### Adding New Features

1. Create feature module following NestJS conventions
2. Add Swagger metadata to controllers
3. Update this documentation
4. Add appropriate tests

### Code Style

- Follow TypeScript best practices
- Use NestJS decorators and patterns
- Implement proper error handling
- Add logging for debugging

### Database Migrations

- Use TypeORM migrations for schema changes
- Test migrations in development first
- Document breaking changes

---

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Check connection strings and database status
2. **Redis Connection Errors**: Verify Redis is running and accessible
3. **Stockfish Not Found**: Ensure Stockfish binary is in PATH
4. **Token Validation Errors**: Check JWT secrets and expiration times

### Logging

The application uses NestJS logger. Check logs for:
- Connection issues
- Authentication failures
- Game state errors
- Redis operations

---

## Contributing

When contributing to this project:

1. Read the relevant module documentation
2. Follow existing code patterns
3. Update documentation for changes
4. Add appropriate tests
5. Ensure all checks pass

---

## License

[Add your license information here]

---

## Support

For questions or issues:
1. Check module-specific documentation
2. Review code comments
3. Check application logs
4. Contact the development team

---

**Last Updated**: [Current Date]
**Version**: 1.0
