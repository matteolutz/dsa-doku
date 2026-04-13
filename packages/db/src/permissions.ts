import { SafeUser, UserRole } from './types';

/**
 * Permission flags for a specific user
 */
export const UserPermissionFlags = {
  ACCESS_PARTICIPANT_ACADEMIES: 0x1n << 0n,

  ACCESS_ALL_ACADEMIES: 0x1n << 20n,
  /**
   * This flag grant the user access to basically everything
   */
  ADMIN: (0x1n << 32n) - 1n
} as const;

export const getPermissionsForRole = (role: UserRole): bigint => {
  switch (role) {
    case UserRole.TN:
    case UserRole.KL:
    case UserRole.AL:
      return UserPermissionFlags.ACCESS_PARTICIPANT_ACADEMIES;

    case UserRole.ADMIN:
      return UserPermissionFlags.ADMIN;

    default:
      return 0n;
  }
};

export const isPermissionFlagSet = (
  permissions: bigint,
  flag: bigint
): boolean => (permissions & flag) !== 0n;

export const hasPermission = (
  user: SafeUser,
  permission: keyof typeof UserPermissionFlags
): boolean =>
  isPermissionFlagSet(
    user.permissions | getPermissionsForRole(user.userRole),
    UserPermissionFlags[permission]
  );
