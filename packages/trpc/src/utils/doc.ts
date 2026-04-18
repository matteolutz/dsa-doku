import { prisma } from '@repo/db';
import { DocumentCategory, DocumentType, SafeUser } from '@repo/db/types';
import { ensureAccessToAcademy } from './academy';
import { ensureAccessToCourse } from './course';
import { fmError } from '../error';

const DOC_CATEGORY_ORDER = [
  DocumentCategory.AL_PREFACE,
  DocumentCategory.KUMU,
  DocumentCategory.COURSE,
  DocumentCategory.KUA
] as const;

export type DocRegnerationTask = {
  from: DocumentType & { id: number };
  startingPageNumber: number;
};

export type DocAddedResult = {
  orderIdx: number;
};

export const docAdded = async (
  docType: DocumentType
): Promise<DocAddedResult> => {
  const {
    _max: { sortOrder: maxDocOrderIdx }
  } = await prisma.document.aggregate({
    _max: { sortOrder: true },
    where: {
      course: docType.type === 'COURSE' ? { id: docType.courseId } : undefined,
      category: docType.type
    }
  });

  return {
    orderIdx: maxDocOrderIdx !== null ? maxDocOrderIdx + 1 : 0
  };
};

export const getAllDocsOfType = async (
  docType: DocumentType,
  user: SafeUser
) => {
  switch (docType.type) {
    case 'COURSE': {
      const course = await prisma.course.findUnique({
        where: {
          id: docType.courseId
        }
      });

      if (!course)
        throw fmError({
          type: 'resource-not-found',
          resource: 'course',
          id: docType.courseId
        });

      await ensureAccessToCourse(user, course);

      return prisma.document.findMany({
        where: {
          course: { id: course.id },
          category: DocumentCategory.COURSE
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });
    }
    default: {
      await ensureAccessToAcademy(user, docType.academyId);

      return prisma.document.findMany({
        where: {
          academy: { id: docType.academyId },
          category: docType.type
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });
    }
  }
};
