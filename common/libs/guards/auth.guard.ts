import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUtils } from '../jwt-utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtUtils: JwtUtils) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const payload = this.jwtUtils.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    req.user = payload;
    return true;
  }
}
