import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CookieOptions } from 'express';
import { UserService } from '../../user/user.service';
import { ENV_VARIABLES, JwtUtils, User } from '../../../common';
import { GoogleOauthProfileDto } from '../../../common';

@Injectable()
export class OauthService {
  constructor(
    private readonly jwtUtils: JwtUtils,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  getGoogleScopes(): string[] {
    return ['openid', 'profile', 'email'];
  }

  async handleGoogleCallback(profile: GoogleOauthProfileDto) {
    const email = profile.email?.trim().toLowerCase();
    if (!email) throw new UnauthorizedException('Google account email is missing');

    let user = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userRelatedData', 'rd')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();

    if (!user) {
      const baseUsername = this.buildBaseUsername(profile, email);
      const username = await this.generateUniqueUsername(baseUsername);

      await this.userService.createUser({
        email,
        username,
        name: profile.firstName || 'Google',
        surname: profile.lastName || 'User',
        password: randomBytes(24).toString('hex'),
      });

      user = await this.userRepository
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.userRelatedData', 'rd')
        .where('LOWER(u.email) = LOWER(:email)', { email })
        .getOne();
    }

    if (!user) throw new UnauthorizedException('OAuth user resolution failed');

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

    return {
      accessToken,
      refreshToken,
      user: safeUser,
      redirectTo: `${this.configService.get<string>(ENV_VARIABLES.FRONTEND_URL)}/auth/callback`,
    };
  }

  getFrontendUrl(): string {
    return this.configService.get<string>(ENV_VARIABLES.FRONTEND_URL) || '/';
  }

  getAuthCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    };
  }

  buildSuccessRedirectUrl(result: { redirectTo?: string; user: unknown }): string {
    const callbackUrl = result.redirectTo || `${this.getFrontendUrl()}/auth/callback`;
    const encodedUser = encodeURIComponent(JSON.stringify(result.user));
    return `${callbackUrl}?user=${encodedUser}`;
  }

  buildFailureRedirectUrl(): string {
    return `${this.getFrontendUrl()}/login?oauth=failed`;
  }

  private buildBaseUsername(profile: GoogleOauthProfileDto, email: string): string {
    const localPart = email.split('@')[0] || 'google_user';
    const preferred = `${profile.firstName || ''}${profile.lastName || ''}`.trim();
    const source = preferred || localPart;

    const normalized = source
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 16);

    return normalized || 'google_user';
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    const base = baseUsername.slice(0, 16) || 'google_user';
    let attempt = base;
    let i = 0;

    while (i < 10) {
      const exists = await this.userRepository
        .createQueryBuilder('u')
        .where('u.username = :username', { username: attempt })
        .getExists();

      if (!exists) return attempt;

      i += 1;
      attempt = `${base.slice(0, 12)}${randomBytes(2).toString('hex')}`.slice(0, 20);
    }

    throw new UnauthorizedException('Unable to allocate username for OAuth user');
  }
}
