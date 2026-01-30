/**
 * E2E Test Setup
 * This file runs before all e2e tests to configure the environment
 */

// Set NODE_ENV to development so tests load .env.development
// Tests run on host machine, so they connect to localhost (Docker exposed ports)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Load environment variables from .env.development if it exists
// This ensures tests can connect to Docker containers via localhost
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', `.env.${process.env.NODE_ENV}`);
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        // Always set the value (even if empty) to ensure it's loaded
        // This handles cases where password might be empty string
        process.env[key] = cleanValue;
      }
    }
  });
  console.log(`Loaded environment variables from: ${envPath}`);
} else {
  console.warn(`Warning: Environment file not found at ${envPath}`);
  console.warn('Make sure .env.development exists with required database credentials');
}

// Override database hosts to use localhost for tests running on host machine
// Docker containers expose ports to localhost
process.env.POSTGRES_HOST = 'localhost';
process.env.MONGO_HOST = 'localhost';
process.env.REDIS_HOST = 'localhost';

// Override ports to match Docker exposed ports
// Note: Redis uses 6380 on host to avoid conflict with local Redis on 6379
// These overrides ensure tests connect to the correct Docker container ports
process.env.POSTGRES_PORT = '5432';
process.env.MONGO_PORT = '27017';
process.env.REDIS_PORT = '6380';

// Ensure password is always a string (even if empty) to avoid TypeORM errors
// PostgreSQL requires password to be a string, not undefined or null
// For Docker PostgreSQL containers, if no password is set, use a default test password
// Note: These defaults match the Docker container configuration
// If your Docker container uses different values, create .env.development with the correct values
if (process.env.POSTGRES_PASSWORD !== undefined && process.env.POSTGRES_PASSWORD !== null && process.env.POSTGRES_PASSWORD !== '') {
  process.env.POSTGRES_PASSWORD = String(process.env.POSTGRES_PASSWORD);
} else {
  // Default password for test environments - matches Docker container default
  process.env.POSTGRES_PASSWORD = 'admin';
  console.warn('Warning: POSTGRES_PASSWORD is not set. Using default "admin".');
  console.warn('If your Docker container uses a different password, create .env.development with POSTGRES_PASSWORD=your_password');
}

// Ensure other required PostgreSQL variables are strings
if (process.env.POSTGRES_USER) {
  process.env.POSTGRES_USER = String(process.env.POSTGRES_USER);
} else {
  // Default user matches Docker container default
  process.env.POSTGRES_USER = 'admin';
  console.warn('Warning: POSTGRES_USER not set, using default "admin"');
}
if (process.env.POSTGRES_DB) {
  process.env.POSTGRES_DB = String(process.env.POSTGRES_DB);
} else {
  // Default database matches Docker container default
  process.env.POSTGRES_DB = 'chess-users';
  console.warn('Warning: POSTGRES_DB not set, using default "chess-users"');
}

// Set JWT secrets for tests (required for authentication)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-tests';
  console.warn('Warning: JWT_SECRET not set, using test default');
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-e2e-tests';
  console.warn('Warning: JWT_REFRESH_SECRET not set, using test default');
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '15m';
}
if (!process.env.JWT_REFRESH_EXPIRES_IN) {
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
}

// Debug: Log database connection info (without password)
console.log('E2E Test Environment Setup:');
console.log(`  POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
console.log(`  POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
console.log(`  POSTGRES_USER: ${process.env.POSTGRES_USER}`);
console.log(`  POSTGRES_DB: ${process.env.POSTGRES_DB}`);
console.log(`  POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '***' : '(not set)'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '***' : '(not set)'}`);
console.log(`  JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? '***' : '(not set)'}`);