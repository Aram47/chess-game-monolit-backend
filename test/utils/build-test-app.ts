import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../../common';
import { ENV_VARIABLES } from '../../common';

/**
 * Builds a test NestJS application with common setup
 * Use this for e2e tests that need a full app instance
 */
export async function buildTestApp(
  moduleMetadata: any,
  additionalSetup?: (app: INestApplication) => void | Promise<void>,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule(
    moduleMetadata,
  ).compile();

  const app = moduleFixture.createNestApplication();

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Additional setup if provided
  if (additionalSetup) {
    await additionalSetup(app);
  }

  await app.init();
  return app;
}

/**
 * Creates a test configuration service with default values
 */
export function createTestConfigService(): ConfigService {
  const config = new Map<string, any>();
  config.set(ENV_VARIABLES.JWT_SECRET, 'test-jwt-secret');
  config.set(ENV_VARIABLES.JWT_REFRESH_SECRET, 'test-jwt-refresh-secret');
  config.set(ENV_VARIABLES.JWT_EXPIRES_IN, '15m');
  config.set(ENV_VARIABLES.JWT_REFRESH_EXPIRES_IN, '7d');

  return {
    get: (key: string) => config.get(key),
  } as ConfigService;
}
