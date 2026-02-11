import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ENV_VARIABLES, JwtUtils, LoginDto } from '../../common';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtUtils: JwtUtils,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.getUserByLoginWithPassword(dto.login);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.userRelatedData) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.password);

    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.userRelatedData.role,
    };

    const accessToken = this.jwtUtils.generateToken(
      payload,
      this.configService.get(ENV_VARIABLES.JWT_EXPIRES_IN),
    );

    const refreshToken = this.jwtUtils.generateRefreshToken(
      payload,
      this.configService.get(ENV_VARIABLES.JWT_REFRESH_EXPIRES_IN),
    );

    const safeUser = this.userService.toUserResponse(user);
    return { accessToken, refreshToken, user: safeUser };
  }

  // This function never called, from the api-gateway controller we use the user service to create a user
  // async register(dto: CreateUserDto) {
  //   await this.userService.createUser(dto);
  // }

  async refresh(refreshToken: string) {
    const refreshTokenPayload = this.jwtUtils.verifyToken(
      refreshToken,
      this.configService.get(ENV_VARIABLES.JWT_REFRESH_SECRET),
    );

    if (!refreshTokenPayload)
      throw new UnauthorizedException('Invalid refresh token');

    let user;
    try {
      user = await this.userService.getUserById(refreshTokenPayload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('User not found');
      }
      throw error;
    }

    if (!user.userRelatedData) {
      throw new UnauthorizedException('User data is incomplete');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.userRelatedData.role,
    };

    const newAccessToken = this.jwtUtils.generateToken(
      payload,
      this.configService.get(ENV_VARIABLES.JWT_EXPIRES_IN),
    );

    const newRefreshToken = this.jwtUtils.generateRefreshToken(
      payload,
      this.configService.get(ENV_VARIABLES.JWT_REFRESH_EXPIRES_IN),
    );

    return { newAccessToken, newRefreshToken };
  }

  async logout(accessToken: string) {
    // TODO: Implement token blacklisting (e.g. Redis-based) for proper invalidation
    const payload = this.jwtUtils.verifyToken(accessToken);

    if (!payload) throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
