import z from 'zod';
import { FileSystemService, procedure, router } from '..';
import { convertToPdfPages } from '@repo/convert';
import { DocumentTypeZod } from '../models/doc';
import { requireUser } from '../utils/auth';
import { ensureAccessToCourse } from '../utils/course';
import { fmError } from '../error';
import path from 'path';
import { generateDocumentUploadNonce } from '../utils/nonce';
import { ensureAccessToAcademy } from '../utils/academy';
import { DocumentCategory } from '@repo/db/types';
import { docAdded } from '../utils/doc';

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

      switch (input.documentType.type) {
        case 'COURSE': {
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

          return ctx.prisma.document.findMany({
            where: {
              course: { id: course.id },
              category: DocumentCategory.COURSE
            },
            orderBy: {
              sortOrder: 'asc'
            }
          });
        }
        default:
          await ensureAccessToAcademy(user, input.documentType.academyId);
          return ctx.prisma.document.findMany({
            where: {
              academy: { id: input.documentType.academyId },
              category: input.documentType.type
            },
            orderBy: {
              sortOrder: 'asc'
            }
          });
      }
    }),
  getUploadNonce: procedure.mutation(async ({ ctx }) => {
    const user = requireUser(ctx);
    return generateDocumentUploadNonce(user.id);
  }),
  create: procedure
    .input(
      z.object({
        documentType: DocumentTypeZod,
        docId: z.string(),
        originalFileName: z.string(),
        title: z.string(),
        containsPageNumbers: z.boolean()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = requireUser(ctx);

      const fs = await FileSystemService.instance.checkDocumentFs(input.docId);
      if (!fs)
        throw fmError({
          type: 'resource-not-found',
          resource: 'uploaded-doc',
          id: input.docId
        }).toTRPCError();

      try {
        switch (input.documentType.type) {
          case 'COURSE':
            const course = await ctx.prisma.course.findUnique({
              where: { id: input.documentType.courseId }
            });
            if (!course)
              throw fmError({
                type: 'resource-not-found',
                resource: 'course',
                id: input.documentType.courseId
              }).toTRPCError();

            await ensureAccessToCourse(user, course, 'write');
          default:
            await ensureAccessToAcademy(user, input.documentType.academyId);
        }
      } catch (err) {
        await FileSystemService.instance.rmDocumentFs(input.docId);
        throw err;
      }

      const inputFile = path.join(fs.rootDir, input.originalFileName);

      const conversionResult = await convertToPdfPages({
        file: { path: inputFile },
        preferredStartingPageNumber: 67,
        options: { tempDir: fs.tempDir, outDir: fs.outDir }
      });

      const { orderIdx } = await docAdded(input.documentType);

      const document = await ctx.prisma.document.create({
        data: {
          id: input.docId,
          title: input.title,
          category: input.documentType.type,
          academy: { connect: { id: input.documentType.academyId } },
          course:
            input.documentType.type == 'COURSE'
              ? { connect: { id: input.documentType.courseId } }
              : undefined,
          numberOfPages: conversionResult.pages.length,
          originalFileName: input.originalFileName,
          sortOrder: orderIdx
        }
      });

      return document;
    })
});
