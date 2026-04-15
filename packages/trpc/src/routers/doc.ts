import z from 'zod';
import { FileSystemService, procedure, router } from '..';
import { convertToPdfPages } from '@repo/convert';
import { DocumentTypeZod } from '../models/doc';
import { requireUser } from '../utils/auth';
import { ensureAccessToCourse } from '../utils/course';
import { fmError } from '../error';
import { AbstractDocument } from '@repo/db/types';
import path from 'path';
import { generateDocumentUploadNonce } from '../utils/nonce';

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
        name: z.string(),
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
          case 'course':
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
            break;
          case 'kua':
          // TODO: break;
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

      let document: AbstractDocument;
      switch (input.documentType.type) {
        case 'course': {
          document = await ctx.prisma.courseDocument.create({
            data: {
              name: input.name,
        16  course: { connect: { id: input.documentType.courseId } },
              numberOfConvertedPages: conversionResult.pages.length,
              docId: input.docId,
              originalFileName: input.originalFileName,
              orderIdx: 1
            }
          });
          break;
        }
        case 'kua': {
          throw new Error('TODO');
        }
      }

      return document;
    })
});
