import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtUtils } from '../../common';
import { ENV_VARIABLES } from '../../common';
import { UserFactory } from '../../test/utils/factories/user.factory';
import { DtoFactory } from '../../test/utils/factories/dto.factory';
import { hashPassword } from '../../test/utils/auth.helper';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtUtils: jest.Mocked<JwtUtils>;
  let configService: jest.Mocked<ConfigService>;
  let bcryptCompareSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock bcrypt.compare
    bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
    // Mock UserService
    const mockUserService = {
      getUserByLoginWithPassword: jest.fn(),
      getUserById: jest.fn(),
      toUserResponse: jest.fn(),
      createUser: jest.fn(),
    };

    // Mock JwtUtils
    const mockJwtUtils = {
      generateToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          [ENV_VARIABLES.JWT_EXPIRES_IN]: '15m',
          [ENV_VARIABLES.JWT_REFRESH_EXPIRES_IN]: '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtUtils,
          useValue: mockJwtUtils,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtUtils = module.get(JwtUtils);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    bcryptCompareSpy.mockRestore();
  });

  describe('login', () => {
    it('should return access token, refresh token, and user when credentials are valid', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto();
      const passwordHash = await hashPassword(loginDto.password);
      const user = UserFactory.build({ password: passwordHash });
      const safeUser = { ...user };
      delete (safeUser as any).password;

      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';

      userService.getUserByLoginWithPassword.mockResolvedValue(user);
      userService.toUserResponse.mockReturnValue(safeUser);
      jwtUtils.generateToken.mockReturnValue(accessToken);
      jwtUtils.generateRefreshToken.mockReturnValue(refreshToken);
      bcryptCompareSpy.mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        accessToken,
        refreshToken,
        user: safeUser,
      });
      expect(userService.getUserByLoginWithPassword).toHaveBeenCalledWith(
        loginDto.login,
      );
      expect(bcryptCompareSpy).toHaveBeenCalledWith(
        loginDto.password,
        passwordHash,
      );
      expect(jwtUtils.generateToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.userRelatedData.role,
        },
        '15m',
      );
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.userRelatedData.role,
        },
        '7d',
      );
      expect(userService.toUserResponse).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto();
      userService.getUserByLoginWithPassword.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(userService.getUserByLoginWithPassword).toHaveBeenCalledWith(
        loginDto.login,
      );
      expect(bcryptCompareSpy).not.toHaveBeenCalled();
      expect(jwtUtils.generateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto({ password: 'wrong-password' });
      const passwordHash = await hashPassword('correct-password');
      const user = UserFactory.build({ password: passwordHash });

      userService.getUserByLoginWithPassword.mockResolvedValue(user);
      bcryptCompareSpy.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(userService.getUserByLoginWithPassword).toHaveBeenCalledWith(
        loginDto.login,
      );
      expect(bcryptCompareSpy).toHaveBeenCalledWith(
        loginDto.password,
        passwordHash,
      );
      expect(jwtUtils.generateToken).not.toHaveBeenCalled();
    });

    it('should generate tokens with correct payload structure', async () => {
      // Arrange
      const loginDto = DtoFactory.buildLoginDto();
      const passwordHash = await hashPassword(loginDto.password);
      const user = UserFactory.buildAdmin({ password: passwordHash });
      const safeUser = { ...user };
      delete (safeUser as any).password;

      userService.getUserByLoginWithPassword.mockResolvedValue(user);
      userService.toUserResponse.mockReturnValue(safeUser);
      jwtUtils.generateToken.mockReturnValue('access-token');
      jwtUtils.generateRefreshToken.mockReturnValue('refresh-token');
      bcryptCompareSpy.mockResolvedValue(true);

      // Act
      await service.login(loginDto);

      // Assert
      expect(jwtUtils.generateToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.userRelatedData.role,
        },
        '15m',
      );
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.userRelatedData.role,
        },
        '7d',
      );
    });
  });

  describe('register', () => {
    it('should call userService.createUser with the provided DTO', async () => {
      // Arrange
      const createUserDto = DtoFactory.buildCreateUserDto();
      userService.createUser.mockResolvedValue(undefined);

      // Act
      await service.register(createUserDto);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(userService.createUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('should return new access and refresh tokens when refresh token is valid', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const refreshTokenPayload = {
        sub: 1,
        email: 'john.doe@example.com',
        role: 'USER',
      };
      const user = UserFactory.build();
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      jwtUtils.verifyToken.mockReturnValue(refreshTokenPayload);
      userService.getUserById.mockResolvedValue(user);
      jwtUtils.generateToken.mockReturnValue(newAccessToken);
      jwtUtils.generateRefreshToken.mockReturnValue(newRefreshToken);
      configService.get.mockImplementation((key: string) => {
        if (key === ENV_VARIABLES.JWT_REFRESH_SECRET) return 'refresh-secret';
        if (key === ENV_VARIABLES.JWT_EXPIRES_IN) return '15m';
        if (key === ENV_VARIABLES.JWT_REFRESH_EXPIRES_IN) return '7d';
        return undefined;
      });

      // Act
      const result = await service.refresh(refreshToken);

      // Assert
      expect(result).toEqual({
        newAccessToken,
        newRefreshToken,
      });
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(
        refreshToken,
        'refresh-secret',
      );
      expect(userService.getUserById).toHaveBeenCalledWith(
        refreshTokenPayload.sub,
      );
      expect(jwtUtils.generateToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.userRelatedData.role,
        },
        '15m',
      );
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.userRelatedData.role,
        },
        '7d',
      );
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';
      jwtUtils.verifyToken.mockReturnValue(null);
      configService.get.mockReturnValue('refresh-secret');

      // Act & Assert
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(
        refreshToken,
        'refresh-secret',
      );
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const refreshTokenPayload = {
        sub: 999,
        email: 'notfound@example.com',
        role: 'USER',
      };

      jwtUtils.verifyToken.mockReturnValue(refreshTokenPayload);
      userService.getUserById.mockResolvedValue(null);
      configService.get.mockReturnValue('refresh-secret');

      // Act & Assert
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        'User not found',
      );
      expect(userService.getUserById).toHaveBeenCalledWith(
        refreshTokenPayload.sub,
      );
    });

    it('should generate new tokens with current user data', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const refreshTokenPayload = {
        sub: 1,
        email: 'old@example.com',
        role: 'USER',
      };
      const user = UserFactory.buildAdmin({
        email: 'new@example.com',
      });

      jwtUtils.verifyToken.mockReturnValue(refreshTokenPayload);
      userService.getUserById.mockResolvedValue(user);
      jwtUtils.generateToken.mockReturnValue('new-access-token');
      jwtUtils.generateRefreshToken.mockReturnValue('new-refresh-token');
      configService.get.mockImplementation((key: string) => {
        if (key === ENV_VARIABLES.JWT_REFRESH_SECRET) return 'refresh-secret';
        if (key === ENV_VARIABLES.JWT_EXPIRES_IN) return '15m';
        if (key === ENV_VARIABLES.JWT_REFRESH_EXPIRES_IN) return '7d';
        return undefined;
      });

      // Act
      await service.refresh(refreshToken);

      // Assert - should use current user data, not token payload
      expect(jwtUtils.generateToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email, // Current email, not from token
          role: user.userRelatedData.role, // Current role, not from token
        },
        '15m',
      );
    });
  });

  describe('logout', () => {
    it('should return true when access token is valid', async () => {
      // Arrange
      const accessToken = 'valid-access-token';
      const payload = {
        sub: 1,
        email: 'john.doe@example.com',
        role: 'USER',
      };

      jwtUtils.verifyToken.mockReturnValue(payload);

      // Act
      const result = await service.logout(accessToken);

      // Assert
      expect(result).toBe(true);
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(accessToken);
    });

    it('should throw UnauthorizedException when access token is invalid', async () => {
      // Arrange
      const accessToken = 'invalid-access-token';
      jwtUtils.verifyToken.mockReturnValue(null);

      // Act & Assert
      await expect(service.logout(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.logout(accessToken)).rejects.toThrow(
        'Invalid access token',
      );
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(accessToken);
    });
  });
});
