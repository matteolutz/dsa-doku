import { DocumentCategory, Prisma } from '@prisma/client';
import z from 'zod';
import { WpBlockSchema } from './wpTypes';

export * from '@prisma/client';

export * from './wpTypes';
export { WpBlockSchema } from './wpTypes';

export * from './error';

export type SafeUser = Prisma.UserGetPayload<{ omit: { password: true } }>;
export type AcademyWithCourses = Prisma.AcademyGetPayload<{
  include: { courses: true };
}>;

export type DocumentTypeWithoutAcademyId =
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
    };

export type DocumentType = DocumentTypeWithoutAcademyId & { academyId: number };

export const DocumentFileMetaSchema = z.object({
  originalFileName: z.string(),
  pages: z.array(z.string()),
  headings: z.array(
    z.object({
      text: z.string(),
      pageOffset: z.int()
    })
  )
});
export type DocumentFileMeta = z.infer<typeof DocumentFileMetaSchema>;

export const DocumentWpMetaSchema = z.object({
  wpPostId: z.int(),
  wpPostLink: z.string(),
  wpPostPaginatedBlocks: z.array(z.array(WpBlockSchema)),
  wpPostLastModified: z.string()
});
export type DocumentWpMeta = z.infer<typeof DocumentWpMetaSchema>;

export const DocumentMetaSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('file'), meta: DocumentFileMetaSchema }),
  z.object({ type: z.literal('wp'), meta: DocumentWpMetaSchema })
]);
export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;

export const AcademyMetaSchema = z.object({
  doku: z.object({
    coverPageDetailedLocation: z.string()
  }),

  akaJournal: z
    .object({
      apiEndpoint: z.string(),
      apiAuthentication: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('applicationPassword'),
            username: z.string(),
            applicationPassword: z.string()
          }),
          z.object({
            type: z.literal('cookie'),
            wpLoginEndpoint: z.string(),
            username: z.string(),
            password: z.string()
          })
        ])
        .optional()
    })
    .optional()
});
export type AcademyMeta = z.infer<typeof AcademyMetaSchema>;

export {
  UserPermissionFlags,
  hasPermission,
  getPermissionsForRole,
  isPermissionFlagSet,
  type ReadWriteScope
} from './permissions';
