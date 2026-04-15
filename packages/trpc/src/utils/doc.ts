import { prisma } from '@repo/db';
import { DocumentCategory, DocumentType } from '@repo/db/types';

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
