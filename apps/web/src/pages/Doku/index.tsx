import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  makeDokuOrder,
  prependTableOfContents,
  type DokuOrderPage
} from './order';
import { useState } from 'react';
import DokuPageRenderer from './page';
import { Button } from '@/components/ui/button';
import LoadingPage from '@/components/fm/loadingPage';
import { AnimatePresence, motion } from 'framer-motion';

const DokuPage = () => {
  const academyId = useSelectedAcademy();
  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId })
  );

  const allDocsQuery = useQuery(
    trpc.doc.getAll.queryOptions(
      { academyId },
      {
        enabled: !!academyQuery.data,
        select: (data): DokuOrderPage[] => {
          const order = makeDokuOrder(data, {
            breakToEvenPageOnNewCategory: false
          });
          console.log('order', order);

          const pages = prependTableOfContents(order, academyQuery.data!, {
            tocStartingPageIndex: 2
          });

          console.log('pages', pages);

          return [{ type: 'cover', academyId }, { type: 'blank' }, ...pages];
        }
      }
    )
  );

  const [currentPage, setCurrentPage] = useState(0);
  const nextPage = () => setCurrentPage((page) => (page === 0 ? 1 : page + 2));
  const prevPage = () => setCurrentPage((page) => (page === 1 ? 0 : page - 2));

  if (!allDocsQuery.data) return <LoadingPage />;

  const getPage = (page: number): DokuOrderPage =>
    page >= 0 && page < allDocsQuery.data.length
      ? allDocsQuery.data[page]
      : { type: 'blank' };

  return (
    <div className="size-full flex flex-col p-2">
      <motion.div
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex w-full justify-center"
      >
        <AnimatePresence>
          {currentPage > 0 && (
            <DokuPageRenderer
              side="left"
              page={getPage(currentPage)}
              absolutePageIndex={currentPage}
            />
          )}
        </AnimatePresence>

        <DokuPageRenderer
          side="right"
          page={getPage(currentPage == 0 ? 0 : currentPage + 1)}
          absolutePageIndex={currentPage == 0 ? 0 : currentPage + 1}
        />
      </motion.div>
      <div className="w-full flex gap-2 p-2">
        <Button disabled={currentPage === 0} onClick={prevPage}>
          Previous
        </Button>
        <Button
          disabled={currentPage === allDocsQuery.data.length - 1}
          onClick={nextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default DokuPage;
