import { SafeUser, UserRole } from './types';

export type ReadWriteScope = 'read' | 'write';

/**
 * Permission flags for a specific user
 */
export const UserPermissionFlags = {
  /**
   * Allow the user to access all academies it participates in
   * (either TN, KL or AL)
   */
  READ_PARTICIPANT_ACADEMIES: 0x1n << 0n,
  WRITE_PARTICIPANT_ACADEMIES: 0x1n << 1n,

  /**
   * Allow the user to read all courses it participates in
   * (either TN or KL). Read and write access are granted by role
   */
  READ_PARTICIPANT_COURSES: 0x1n << 2n,
  WRITE_PARTICIPANT_COURSES: 0x1n << 3n,

  /**
   * Allow the user to read all courses inside an academy
   * (if the user has access to the academy itself)
   */
  READ_ALL_ACADEMY_WIDE_COURSES: 0x1n << 10n,

  /**
   * Allow the user to write all courses inside an academy
   * (if the user has write access to the academy itself)
   */
  WRITE_ALL_ACADEMY_WIDE_COURSES: 0x1n << 11n,

  /**
   * Allow the user to read all academies
   */
  READ_ALL_ACADEMIES: 0x1n << 20n,

  /**
   * Allow the user to write all academies
   */
  WRITE_ALL_ACADEMIES: 0x1n << 21n,

  /**
   * This flag grant the user access to basically everything
   */
  ADMIN: (0x1n << 32n) - 1n
} as const;

export const getPermissionsForRole = (role: UserRole): bigint => {
  const basePermissions =
    UserPermissionFlags.READ_PARTICIPANT_ACADEMIES |
    UserPermissionFlags.READ_PARTICIPANT_COURSES;

  switch (role) {
    case UserRole.TN:
      return basePermissions;

    case UserRole.KL:
      return basePermissions | UserPermissionFlags.WRITE_PARTICIPANT_COURSES;

    case UserRole.AL:
      return (
        basePermissions |
        UserPermissionFlags.WRITE_PARTICIPANT_ACADEMIES |
        UserPermissionFlags.READ_ALL_ACADEMY_WIDE_COURSES |
        UserPermissionFlags.WRITE_ALL_ACADEMY_WIDE_COURSES
      );

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
