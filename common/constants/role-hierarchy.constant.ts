import { Role } from '../enums';

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.ADMIN, Role.USER],
  [Role.ADMIN]: [Role.USER],
  [Role.USER]: [],
};
