import type { AppRoleType } from '../supabase/types';

export interface UserRoleAssignment {
  role_name: string;
  center_id: string | null;
  hierarchy_level: number;
}

export function hasRole(roles: UserRoleAssignment[] | undefined, targetRoles: AppRoleType | AppRoleType[]): boolean {
  if (!roles || roles.length === 0) return false;
  const targetList = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
  return roles.some((r) => targetList.includes(r.role_name as AppRoleType));
}

export function isSuperAdmin(roles: UserRoleAssignment[] | undefined): boolean {
  return hasRole(roles, 'super_admin');
}

export function isAdminOrAbove(roles: UserRoleAssignment[] | undefined): boolean {
  return hasRole(roles, ['super_admin', 'admin']);
}

export function canAccessCenter(roles: UserRoleAssignment[] | undefined, targetCenterId: string | null | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  if (isAdminOrAbove(roles)) return true;
  if (!targetCenterId) return false;

  return roles.some((r) => r.role_name === 'center_coordinator' && r.center_id === targetCenterId);
}

export function getAccessibleCenterIds(roles: UserRoleAssignment[] | undefined): string[] | 'all' {
  if (!roles || roles.length === 0) return [];
  if (isAdminOrAbove(roles)) return 'all';

  return roles
    .filter((r) => r.role_name === 'center_coordinator' && r.center_id)
    .map((r) => r.center_id as string);
}
