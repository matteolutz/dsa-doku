import { Prisma } from '@prisma/client';

export * from '@prisma/client';

export type SafeUser = Prisma.UserGetPayload<{ omit: { password: true } }>;

export type AbstractDocument = {
  name: string;
  docId: string;

  orderIdx: number;
  numberOfConvertedPages: number;
};

// TODO: add more
export type DocumentType =
  | {
      type: 'course';
      courseId: number;
    }
  | {
      type: 'kua';
      academyId: number;
    };

export {
  UserPermissionFlags,
  hasPermission,
  getPermissionsForRole,
  isPermissionFlagSet,
  type ReadWriteScope
} from './permissions';
