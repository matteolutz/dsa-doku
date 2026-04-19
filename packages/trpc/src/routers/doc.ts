import z from 'zod';
import { FileSystemService, procedure, router } from '..';
import { convertToPdfPages } from '@repo/convert';
import { DocumentTypeZod } from '../models/doc';
import { requireUser } from '../utils/auth';
import { ensureAccessToCourse } from '../utils/course';
import { fmError } from '../error';
import path from 'path';
import {
  generateDocumentUploadNonce,
  generateReadDocumentNonce
} from '../utils/nonce';
import { ensureAccessToAcademy } from '../utils/academy';
import { DocumentCategory, DocumentMeta } from '@repo/db/types';
import { docAdded, getAllDocsOfType } from '../utils/doc';

export const docRouter = router({
  onEvent: procedure.subscription(async function* ({ ctx, input }) {
    const user = requireUser(ctx);
  }),
  getDocNonce: procedure
    .input(
      z.object({
        docId: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const user = requireUser(ctx);
      const doc = await ctx.prisma.document.findUnique({
        where: { id: input.docId }
      });

      if (!doc)
        throw fmError({
          type: 'resource-not-found',
          resource: 'doc',
          id: input.docId
        }).toTRPCError();

      // TODO: check permissions

      const docMeta: DocumentMeta = doc.meta as DocumentMeta;
      if (docMeta.type !== 'file')
        throw fmError({
          type: 'document-type-mismatch',
          expected: 'file',
          actual: docMeta.type
        }).toTRPCError();

      return generateReadDocumentNonce(user.id, {
        docId: doc.id,
        docPages: docMeta.meta.pages
      });
    }),
  getAll: procedure
    .input(z.object({ academyId: z.int() }))
    .query(async ({ ctx, input }) => {
      const user = requireUser(ctx);
      await ensureAccessToAcademy(user, input.academyId);

      const docs = [];

      // 1. AL_PREFACE
      docs.push(
        ...(await getAllDocsOfType(
          { type: DocumentCategory.AL_PREFACE, academyId: input.academyId },
          user
        ))
      );

      // 2. KUMU
      docs.push(
        ...(await getAllDocsOfType(
          { type: DocumentCategory.KUMU, academyId: input.academyId },
          user
        ))
      );

      // 3. COURSE
      for (const { id: courseId } of await ctx.prisma.course.findMany({
        where: { academy: { id: input.academyId } },
        select: { id: true },
        orderBy: {
          courseIdx: 'asc'
        }
      })) {
        docs.push(
          ...(await getAllDocsOfType(
            {
              type: DocumentCategory.COURSE,
              courseId,
              academyId: input.academyId
            },
            user
          ))
        );
      }

      // 4. KUA
      docs.push(
        ...(await getAllDocsOfType(
          { type: DocumentCategory.KUA, academyId: input.academyId },
          user
        ))
      );

      return docs;
    }),
  getAllOfType: procedure
    .input(
      z.object({
        documentType: DocumentTypeZod
      })
    )
    .query(async ({ input, ctx }) => {
      const user = requireUser(ctx);

      return getAllDocsOfType(input.documentType, user);
    }),
  getUploadNonce: procedure.mutation(async ({ ctx }) => {
    const user = requireUser(ctx);
    return generateDocumentUploadNonce(user.id);
  }),
  delete: procedure
    .input(
      z.object({
        docId: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = requireUser(ctx);

      const doc = await ctx.prisma.document.findUnique({
        where: { id: input.docId }
      });

      if (!doc)
        throw fmError({
          type: 'resource-not-found',
          resource: 'doc',
          id: input.docId
        }).toTRPCError();

      switch (doc.category) {
        case 'COURSE':
          await ensureAccessToCourse(user, doc.courseId!, 'write');
          break;
        default:
          await ensureAccessToAcademy(user, doc.academyId, 'write');
          break;
      }

      await ctx.prisma.document.delete({
        where: { id: input.docId }
      });
      await FileSystemService.instance.rmDocumentFs(doc.id);
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

      const docFs = await FileSystemService.instance.checkDocumentFs(
        input.docId
      );
      if (!docFs)
        throw fmError({
          type: 'resource-not-found',
          resource: 'uploaded-doc',
          id: input.docId
        }).toTRPCError();

      try {
        switch (input.documentType.type) {
          case 'COURSE': {
            await ensureAccessToCourse(
              user,
              input.documentType.courseId,
              'write'
            );
            break;
          }
          default:
            await ensureAccessToAcademy(
              user,
              input.documentType.academyId,
              'write'
            );
            break;
        }
      } catch (err) {
        await FileSystemService.instance.rmDocumentFs(input.docId);
        throw err;
      }

      const inputFile = path.join(docFs.rootDir, input.originalFileName);

      const conversionResult = await convertToPdfPages({
        file: { path: inputFile },
        removePageNumbers: input.containsPageNumbers,
        options: { tempDir: docFs.tempDir, outDir: docFs.outDir }
      });

      const { orderIdx } = await docAdded(input.documentType);

      const meta: DocumentMeta = {
        type: 'file',
        meta: {
          originalFileName: input.originalFileName,
          pages: conversionResult.pages.map(({ path: pagePath }) =>
            path.basename(pagePath)
          ),
          headings: conversionResult.headings
        }
      };

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
          meta,
          sortOrder: orderIdx
        }
      });

      return document;
    })
});
