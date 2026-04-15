import { DocumentCategory, Prisma } from '@prisma/client';

export * from '@prisma/client';

export type SafeUser = Prisma.UserGetPayload<{ omit: { password: true } }>;

export type DocumentType = (
  | {
      type: typeof DocumentCategory.COURSE;
      courseId: number;
    }
  | {
      type: typeof DocumentCategory.KUA;
    }
  | {
      type: typeof DocumentCategory.AL_PREFACE;
    }
  | {
      type: typeof DocumentCategory.KUMU;
    }
) & { academyId: number };

export {
  UserPermissionFlags,
  hasPermission,
  getPermissionsForRole,
  isPermissionFlagSet,
  type ReadWriteScope
} from './permissions';
