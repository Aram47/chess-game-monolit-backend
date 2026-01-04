import { Role, Permission } from '../enums';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.CREATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_DASHBOARD,
  ],
  [Role.ADMIN]: [Permission.CREATE_USER, Permission.VIEW_DASHBOARD],
  [Role.USER]: [],
};
