import { SafeUser } from './types';

/**
 * Permission flags for user roles.
 */
export const UserRolePermissionFlags = {} as const;

/**
 * Permission flags for a specific user
 */
export const UserPermissionFlags = {
  /**
   * This flag grant the user access to basically everything
   */
  ADMIN: (0x1n << 32n) - 1n
} as const;

export const isPermissionFlagSet = (
  permissions: bigint,
  flag: bigint
): boolean => (permissions & flag) !== 0n;

export const hasPermission = (
  user: SafeUser,
  permission: keyof typeof UserPermissionFlags
): boolean =>
  isPermissionFlagSet(user.permissions, UserPermissionFlags[permission]);
