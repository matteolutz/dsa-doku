import z from 'zod';
import { FileSystemService, procedure, router } from '..';
import { ConversionFnProgress, convertToPdfPages } from '@repo/convert';
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
import {
  AcademyMeta,
  DocumentCategory,
  DocumentMeta,
  Prisma,
  WpBlockSchema
} from '@repo/db/types';
import { docAdded, getAllDocsOfType } from '../utils/doc';
import unzipper from 'unzipper';
import { searchFileRecursively } from '../utils/fs';
import { EventEmitter, on } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { getS3Client } from '../s3';

const docConversionProgressEventEmitter = new EventEmitter();

export const docRouter = router({
  onConversionEvent: procedure
    .input(z.object({ docId: z.string() }))
    .subscription(async function* ({ input, signal }) {
      // TODO: find way to authenticate user

      for await (const [data] of on(
        docConversionProgressEventEmitter,
        input.docId,
        {
          signal
        }
      )) {
        const progress = data as ConversionFnProgress;
        yield progress;
      }
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
  reorder: procedure
    .input(
      z.object({
        docType: DocumentTypeZod,

        /**
         * The new order of the documents (containing all document ids of the given type)
         */
        newOrder: z.array(z.string())
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = requireUser(ctx);

      // make sure we have write access to the documents of the specified type
      // and also prepare the where clause for the update
      let whereClause: Prisma.DocumentWhereInput;
      switch (input.docType.type) {
        case 'COURSE':
          await ensureAccessToCourse(user, input.docType.courseId, 'write');
          whereClause = {
            category: 'COURSE',
            courseId: input.docType.courseId
          };
          break;
        default:
          await ensureAccessToAcademy(user, input.docType.academyId, 'write');
          whereClause = {
            category: input.docType.type,
            academyId: input.docType.academyId
          };
          break;
      }

      await ctx.prisma.$transaction(async (prisma) => {
        for (let i = 0; i < input.newOrder.length; i++) {
          const docId = input.newOrder[i]!;

          await prisma.document.update({
            where: {
              ...whereClause,
              id: docId
            },
            data: {
              sortOrder: i
            }
          });
        }
      });
    }),
  rename: procedure
    .input(
      z.object({
        docId: z.string(),
        title: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = requireUser(ctx);

      const document = await ctx.prisma.document.findUnique({
        where: { id: input.docId }
      });

      // only allow renaming files. to rename a wp document, use the updateJournal mutation
      if (!document || (document.meta as DocumentMeta).type !== 'file')
        throw fmError({
          type: 'resource-not-found',
          resource: 'doc',
          id: input.docId
        }).toTRPCError();

      // make sure we have accces
      switch (document.category) {
        case 'COURSE': {
          await ensureAccessToCourse(user, document.courseId!, 'write');
          break;
        }
        default:
          await ensureAccessToAcademy(user, document.academyId, 'write');
          break;
      }

      const updatedDocument = await ctx.prisma.document.update({
        where: { id: input.docId },
        data: { title: input.title }
      });

      return updatedDocument;
    }),
  updateJournal: procedure
    .input(
      z.object({
        docId: z.string(),
        title: z.string(),
        wpPostId: z.int(),
        wpPostLink: z.string(),
        wpPostLastModified: z.string(),

        /**
         * The blocks will be generated by the client
         */
        wpBlocks: z.array(z.array(WpBlockSchema))
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = requireUser(ctx);

      const document = await ctx.prisma.document.findUnique({
        where: {
          id: input.docId
        }
      });

      if (!document || (document.meta as DocumentMeta).type !== 'wp')
        throw fmError({
          type: 'resource-not-found',
          resource: 'doc',
          id: input.docId
        }).toTRPCError();

      // make sure we have accces
      switch (document.category) {
        case 'COURSE': {
          await ensureAccessToCourse(user, document.courseId!, 'write');
          break;
        }
        default:
          await ensureAccessToAcademy(user, document.academyId, 'write');
          break;
      }

      const meta: DocumentMeta = {
        type: 'wp',
        meta: {
          wpPostId: input.wpPostId,
          wpPostLink: input.wpPostLink,
          wpPostLastModified: input.wpPostLastModified,
          wpPostPaginatedBlocks: input.wpBlocks
        }
      };

      return await ctx.prisma.document.update({
        where: {
          id: input.docId
        },
        data: {
          title: input.title,
          meta
        }
      });
    }),
  createJournal: procedure
    .input(
      z.object({
        documentType: DocumentTypeZod,
        title: z.string(),
        wpPostId: z.int(),
        wpPostLink: z.string(),
        wpPostLastModified: z.string(),

        /**
         * The blocks will be generated by the client
         */
        wpBlocks: z.array(z.array(WpBlockSchema))
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = requireUser(ctx);

      // make sure we have accces
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

      const academy = await ctx.prisma.academy.findUnique({
        where: { id: input.documentType.academyId }
      });
      if (!academy)
        throw fmError({
          type: 'resource-not-found',
          resource: 'academy',
          id: input.documentType.academyId
        }).toTRPCError();

      // make sure the academy has an aka journal api endpoint configured
      const academyMeta = academy.meta as AcademyMeta;
      if (typeof academyMeta.akaJournal === 'undefined')
        throw fmError({
          type: 'academy-feature-not-enabled',
          feature: 'aka-journal'
        }).toTRPCError();

      const { orderIdx } = await docAdded(input.documentType);

      const meta: DocumentMeta = {
        type: 'wp',
        meta: {
          wpPostId: input.wpPostId,
          wpPostLink: input.wpPostLink,
          wpPostPaginatedBlocks: input.wpBlocks,
          wpPostLastModified: input.wpPostLastModified
        }
      };

      const document = await ctx.prisma.document.create({
        data: {
          id: uuidv4(),
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
    }),
  createFile: procedure
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

        let inputFile = path.join(docFs.rootDir, input.originalFileName);

        if (path.extname(inputFile) === '.zip') {
          // a zip file means we have to extract it first
          const zipOutDir = path.join(docFs.rootDir, 'zip-out');

          const directory = await unzipper.Open.file(inputFile);
          await directory.extract({ path: zipOutDir });

          // TODO: find a better way to do this
          const mainTexFile = await searchFileRecursively(
            zipOutDir,
            'main.tex'
          );
          if (mainTexFile === null)
            throw fmError({
              type: 'resource-not-found',
              resource: 'doc-fs',
              id: 'main.tex'
            }).toTRPCError();

          inputFile = mainTexFile;
        }

        const conversionResult = await convertToPdfPages(
          {
            file: { path: inputFile },
            removePageNumbers: input.containsPageNumbers,
            options: { tempDir: docFs.tempDir, outDir: docFs.outDir }
          },
          {
            onProgress: (progress) =>
              docConversionProgressEventEmitter.emit(input.docId, progress)
          }
        );

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
      } catch (err) {
        await FileSystemService.instance.rmDocumentFs(input.docId);
        throw err;
      }
    })
});
