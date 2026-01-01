import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, ENV_VARIABLES, JwtUtils, LoginDto } from '../../common';

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

  async register(dto: CreateUserDto) {
    await this.userService.createUser(dto);
  }

  async refresh(refreshToken: string) {
    const refreshTokenPayload = this.jwtUtils.verifyToken(
      refreshToken,
      this.configService.get(ENV_VARIABLES.JWT_REFRESH_SECRET),
    );

    if (!refreshTokenPayload)
      throw new UnauthorizedException('Invalid refresh token');

    const user = await this.userService.getUserById(refreshTokenPayload.sub);

    if (!user) throw new UnauthorizedException('User not found');

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
    // In a real-world application, you might want to implement token blacklisting here.
    const payload = this.jwtUtils.verifyToken(accessToken);

    if (!payload) throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
