import { prisma } from '@repo/db';
import { DocumentType } from '@repo/db/types';
import { todo } from '../error';

export type DocRegnerationTask = {
  from: DocumentType & { id: number };
  startingPageNumber: number;
};

export type DocAddedResult = {
  orderIdx: number | null;
};

export const getDocOrderIdx = async (
  docType: DocumentType
): Promise<DocAddedResult> => {
  let docOrderIdx = null;
  switch (docType.type) {
    case 'course': {
      const {
        _max: { orderIdx: maxDocOrderIdx }
      } = await prisma.courseDocument.aggregate({
        _max: { orderIdx: true },
        where: { course: { id: docType.courseId } }
      });

      docOrderIdx = maxDocOrderIdx !== null ? maxDocOrderIdx + 1 : 0;

      break;
    }
    case 'kua':
      throw todo('kua document upload').toTRPCError();
  }

  return { orderIdx: docOrderIdx };
};
