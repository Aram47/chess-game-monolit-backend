import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators';
import { Permission, ROLE_PERMISSIONS } from '../../';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    return requiredPermissions.every((p) => userPermissions.includes(p));
  }
}
