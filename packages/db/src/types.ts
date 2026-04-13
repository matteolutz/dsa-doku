import { Prisma } from '@prisma/client';

export * from '@prisma/client';

export type SafeUser = Prisma.UserGetPayload<{ omit: { password: true } }>;

export {
  UserPermissionFlags,
  hasPermission,
  getPermissionsForRole,
  isPermissionFlagSet
} from './permissions';
