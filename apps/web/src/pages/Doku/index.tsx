import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  makeDokuOrder,
  prependTableOfContents,
  type DokuOrderPage
} from './order';
import DokuPageRenderer from './page';
import { Button } from '@/components/ui/button';
import LoadingPage from '@/components/fm/loadingPage';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router';

const DokuPage = () => {
  const academyId = useSelectedAcademy();
  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId })
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const currentSheet = Number(searchParams.get('p') ?? '0');
  const setCurrentSheet = (p: number) => {
    searchParams.set('p', p.toString());
    setSearchParams(searchParams);
  };
  const nextSheet = () => setCurrentSheet(currentSheet + 1);
  const prevSheet = () => setCurrentSheet(currentSheet - 1);

  const goToPage = (page: number) =>
    setCurrentSheet(Math.floor((page - 1) / 2) + 1);

  const currentPage = (currentSheet - 1) * 2 + 1;

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

  if (!allDocsQuery.data) return <LoadingPage />;

  const getPage = (page: number): DokuOrderPage =>
    page >= 0 && page < allDocsQuery.data.length
      ? allDocsQuery.data[page]
      : { type: 'blank' };

  console.log(currentPage);

  return (
    <div className="size-full flex flex-col p-2">
      <motion.div
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex w-full justify-center"
      >
        <AnimatePresence>
          {currentPage > 0 && (
            <DokuPageRenderer
              context={{ goToPage }}
              side="left"
              page={getPage(currentPage)}
              absolutePageIndex={currentPage}
            />
          )}
        </AnimatePresence>

        <DokuPageRenderer
          context={{ goToPage }}
          side="right"
          page={getPage(currentPage + 1)}
          absolutePageIndex={currentPage + 1}
        />
      </motion.div>
      <div className="w-full flex gap-2 p-2">
        <Button disabled={currentPage === 0} onClick={prevSheet}>
          Previous
        </Button>
        <Button
          disabled={currentPage === allDocsQuery.data.length - 1}
          onClick={nextSheet}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default DokuPage;
