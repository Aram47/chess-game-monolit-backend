import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, ENV_VARIABLES, JwtUtils } from '../../common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../common/dtos/user/user.login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtUtils: JwtUtils,
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

  async refresh() {}

  async logout() {}
}
