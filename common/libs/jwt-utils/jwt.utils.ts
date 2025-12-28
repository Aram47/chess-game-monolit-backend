import { ENV_VARIABLES } from '../../';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class JwtUtils {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateToken<T extends object = any>(
    payload: T,
    expiresIn: JwtSignOptions['expiresIn'],
  ) {
    return this.jwtService.sign<T>(payload, {
      secret: this.configService.get<string>(ENV_VARIABLES.JWT_SECRET),
      expiresIn,
    });
  }

  generateRefreshToken<T extends object = any>(
    payload: T,
    expiresIn: JwtSignOptions['expiresIn'],
  ) {
    return this.jwtService.sign<T>(payload, {
      secret: this.configService.get<string>(ENV_VARIABLES.JWT_REFRESH_SECRET),
      expiresIn,
    });
  }

  verifyToken(token: string, secret?: string): any {
    try {
      return this.jwtService.verify(token, {
        secret:
          secret || this.configService.get<string>(ENV_VARIABLES.JWT_SECRET),
      });
    } catch (error) {
      console.error(error);
      return null; // Invalid token
    }
  }
}
