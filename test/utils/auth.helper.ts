import * as bcrypt from 'bcrypt';

/**
 * Helper to hash password for test fixtures
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Helper to create a user with hashed password for tests
 */
export async function createUserWithHashedPassword(
  password: string = 'StrongP@ssw0rd!',
): Promise<string> {
  return hashPassword(password);
}

/**
 * Helper to verify password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
