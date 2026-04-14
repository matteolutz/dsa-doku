import z from 'zod';
import { procedure, router } from '..';
import { convertToPdfPages } from '@repo/convert';
import { DocumentTypeZod } from '../models/doc';
import { requireUser } from '../utils/auth';
import { ensureAccessToCourse } from '../utils/course';
import { fmError } from '../error';
import { AbstractDocument } from '@repo/db/types';

export const docRouter = router({
  onEvent: procedure.subscription(async function* ({ ctx, input }) {
    const user = requireUser(ctx);
  }),
  getAll: procedure
    .input(
      z.object({
        documentType: DocumentTypeZod
      })
    )
    .query(async ({ input, ctx }) => {
      const user = requireUser(ctx);

      let documents: AbstractDocument[];
      switch (input.documentType.type) {
        case 'course': {
          const course = await ctx.prisma.course.findUnique({
            where: {
              id: input.documentType.courseId
            }
          });

          if (!course)
            throw fmError({
              type: 'resource-not-found',
              resource: 'course',
              id: input.documentType.courseId
            });

          await ensureAccessToCourse(user, course);

          documents = await ctx.prisma.courseDocument.findMany({
            where: { course: { id: course.id } }
          });
          break;
        }
        case 'kua':
          documents = [];
          break;
      }

      return documents;
    }),
  create: procedure
    .input(
      z.object({
        documentType: DocumentTypeZod,
        name: z.string(),
        file: z.instanceof(File)
      })
    )
    .mutation(async () => {
      const tempDir = '/Users/matteolutz/Desktop/temp';
      const outDir = '/Users/matteolutz/Desktop/out';
      const testFile =
        '/Users/matteolutz/Desktop/VBT Schwäbisch Gmünd Ablauf.pdf';

      try {
        const result = await convertToPdfPages({
          file: { path: testFile },
          preferredStartingPageNumber: 67,
          options: { tempDir, outDir }
        });
        console.log('result:', result);
      } catch (e) {
        console.log(e);
      }
    })
});
