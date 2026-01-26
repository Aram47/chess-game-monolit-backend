import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as cookie from 'cookie';
import { Socket } from 'socket.io';
import { JwtUtils } from '../jwt-utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtUtils: JwtUtils) {}

  canActivate(context: ExecutionContext): boolean {
    switch (context.getType()) {
      case 'http':
        return this.canActivateHttpInternal(context);
      case 'ws':
        return this.canActivateWsInternal(context);
      case 'rpc':
        return false;
    }
  }

  canActivateWsInternal(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      throw new UnauthorizedException('No cookies provided');
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.accessToken;

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }
    const user = this.jwtUtils.verifyToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    client.data.user = user;
    return true;
  }

  private canActivateHttpInternal(context: ExecutionContext) {
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
