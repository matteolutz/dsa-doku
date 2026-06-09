import { trpc } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  makeDokuOrder,
  prependTableOfContents,
  type DokuOrderPage
} from './order';
import type { AcademyWithCourses, Document } from '@repo/db/types';
import { useCallback } from 'react';

const useSelectFunction = (
  academyId: number,
  academy: AcademyWithCourses | null
) =>
  useCallback(
    (data: Document[]): DokuOrderPage[] => {
      const order = makeDokuOrder(data, {
        breakToEvenPageOnNewCategory: false
      });
      console.log('order', order);

      const pages = prependTableOfContents(order, academy!, {
        tocStartingPageIndex: 2
      });

      console.log('pages', pages);

      return [{ type: 'cover', academyId }, { type: 'blank' }, ...pages];
    },
    [academyId, academy]
  );

export const useAcademyDocsQuery = (
  academyId: number,
  academy: AcademyWithCourses | null
) =>
  useQuery(
    trpc.doc.getAll.queryOptions(
      { academyId },
      {
        enabled: academy !== null,
        select: useSelectFunction(academyId, academy)
      }
    )
  );
