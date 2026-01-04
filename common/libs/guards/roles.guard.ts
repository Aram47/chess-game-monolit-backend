import { Role } from '../../enums';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';
import { ROLE_HIERARCHY } from '../../constants';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) return false;

    if (requiredRoles.includes(user.role)) return true;

    const inheritedRoles = ROLE_HIERARCHY[user.role] || [];

    return requiredRoles.some((role) => inheritedRoles.includes(role));
  }
}
