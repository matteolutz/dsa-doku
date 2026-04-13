import { Prisma } from '@prisma/client';

export * from '@prisma/client';

export type SafeUser = Prisma.UserGetPayload<{ omit: { password: true } }>;

export {
  UserRolePermissionFlags,
  UserPermissionFlags,
  hasPermission,
  isPermissionFlagSet
} from './permissions';
