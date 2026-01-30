import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DtoFactory } from './utils/factories/dto.factory';
import { hashPassword } from './utils/auth.helper';
import { DataSource } from 'typeorm';
import { User } from '../common';
import { UserRelatedData } from '../common';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource && dataSource.isInitialized) {
      try {
        const userRepository = dataSource.getRepository(User);

        // Delete test users (UserRelatedData will be deleted by CASCADE)
        await userRepository
          .createQueryBuilder()
          .delete()
          .where("email LIKE '%@test.example.com'")
          .orWhere("username LIKE 'test_%'")
          .orWhere("email LIKE 'login-%@test.example.com'")
          .orWhere("email LIKE 'refresh-%@test.example.com'")
          .orWhere("email LIKE 'logout-%@test.example.com'")
          .execute();
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Cleanup error (ignored):', error);
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto = DtoFactory.buildCreateUserDto({
        email: `test-${Date.now()}@test.example.com`,
        username: `test_${Date.now()}`,
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/register')
        .send(registerDto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        name: registerDto.name,
        surname: registerDto.surname,
        username: registerDto.username,
        email: registerDto.email,
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 400 when email is invalid', async () => {
      // Arrange
      const registerDto = DtoFactory.buildCreateUserDto({
        email: 'invalid-email',
        username: `test_${Date.now()}`,
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 when password is too weak', async () => {
      // Arrange
      const registerDto = DtoFactory.buildCreateUserDto({
        email: `test-${Date.now()}@test.example.com`,
        username: `test_${Date.now()}`,
        password: 'weak',
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      const registerDto = DtoFactory.buildCreateUserDto({
        email: `duplicate-${Date.now()}@test.example.com`,
        username: `test_${Date.now()}`,
      });

      // Create first user
      await request(app.getHttpServer())
        .post('/api/register')
        .send(registerDto)
        .expect(201);

      // Try to create duplicate
      const duplicateDto = DtoFactory.buildCreateUserDto({
        email: registerDto.email, // Same email
        username: `test_${Date.now()}_2`, // Different username
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/register')
        .send(duplicateDto)
        .expect(409);
    });

    it('should return 409 when username already exists', async () => {
      // Arrange
      const registerDto = DtoFactory.buildCreateUserDto({
        email: `test-${Date.now()}@test.example.com`,
        username: `duplicate_${Date.now()}`,
      });

      // Create first user
      await request(app.getHttpServer())
        .post('/api/register')
        .send(registerDto)
        .expect(201);

      // Try to create duplicate
      const duplicateDto = DtoFactory.buildCreateUserDto({
        email: `test-${Date.now()}_2@test.example.com`, // Different email
        username: registerDto.username, // Same username
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/register')
        .send(duplicateDto)
        .expect(409);
    });
  });

  describe('POST /api/login', () => {
    let testUser: {
      email: string;
      username: string;
      password: string;
    };

    beforeEach(async () => {
      // Create a test user for login tests
      testUser = {
        email: `login-${Date.now()}@test.example.com`,
        username: `login_${Date.now()}`,
        password: 'StrongP@ssw0rd!',
      };

      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          ...DtoFactory.buildCreateUserDto(),
          ...testUser,
        })
        .expect(201);
    });

    it('should login successfully with email and return user without password', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({
        login: testUser.email,
        password: testUser.password,
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/login')
        .send(loginDto)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        email: testUser.email,
        username: testUser.username,
      });
      expect(response.body).not.toHaveProperty('password');
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      expect(
        cookies.some((cookie: string) =>
          cookie.includes('accessToken'),
        ),
      ).toBe(true);
      expect(
        cookies.some((cookie: string) =>
          cookie.includes('refreshToken'),
        ),
      ).toBe(true);
    });

    it('should login successfully with username and return user without password', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({
        login: testUser.username,
        password: testUser.password,
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/login')
        .send(loginDto)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        email: testUser.email,
        username: testUser.username,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 when email is incorrect', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({
        login: 'nonexistent@test.example.com',
        password: testUser.password,
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 when password is incorrect', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({
        login: testUser.email,
        password: 'WrongPassword123!',
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 400 when login field is too short', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({
        login: 'ab', // Too short
        password: testUser.password,
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({
        login: testUser.email,
        password: 'short', // Too short
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('POST /api/refresh', () => {
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Create a test user and login to get tokens
      const testUser = {
        email: `refresh-${Date.now()}@test.example.com`,
        username: `refresh_${Date.now()}`,
        password: 'StrongP@ssw0rd!',
      };

      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          ...DtoFactory.buildCreateUserDto(),
          ...testUser,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/login')
        .send({
          login: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // Extract refresh token cookie
      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      refreshTokenCookie = cookies.find((cookie: string) =>
        cookie.includes('refreshToken'),
      );
    });

    it('should refresh tokens successfully', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/api/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        message: 'Tokens refreshed successfully',
      });
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      expect(
        cookies.some((cookie: string) =>
          cookie.includes('accessToken'),
        ),
      ).toBe(true);
      expect(
        cookies.some((cookie: string) =>
          cookie.includes('refreshToken'),
        ),
      ).toBe(true);
    });

    it('should return 401 when refresh token is missing', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/refresh')
        .expect(401);
    });

    it('should return 401 when refresh token is invalid', async () => {
      // Arrange
      const invalidCookie = 'refreshToken=invalid-token';

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/refresh')
        .set('Cookie', invalidCookie)
        .expect(401);
    });
  });

  describe('POST /api/logout', () => {
    let accessTokenCookie: string;

    beforeEach(async () => {
      // Create a test user and login to get tokens
      const testUser = {
        email: `logout-${Date.now()}@test.example.com`,
        username: `logout_${Date.now()}`,
        password: 'StrongP@ssw0rd!',
      };

      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          ...DtoFactory.buildCreateUserDto(),
          ...testUser,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/login')
        .send({
          login: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // Extract access token cookie
      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      accessTokenCookie = cookies.find((cookie: string) =>
        cookie.includes('accessToken'),
      );
    });

    it('should logout successfully and clear cookies', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/api/logout')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        message: 'Logged out successfully',
      });
      // Check that cookies are cleared
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        cookies.forEach((cookie: string) => {
          expect(cookie).toMatch(/accessToken=.*Max-Age=0/);
          expect(cookie).toMatch(/refreshToken=.*Max-Age=0/);
        });
      }
    });

    it('should return 401 when access token is missing', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/logout')
        .expect(401);
    });

    it('should return 401 when access token is invalid', async () => {
      // Arrange
      const invalidCookie = 'accessToken=invalid-token';

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/logout')
        .set('Cookie', invalidCookie)
        .expect(401);
    });
  });
});
