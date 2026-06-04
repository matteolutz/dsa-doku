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
import { ChevronLeft, ChevronRight, Expand } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

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

  const numPages = allDocsQuery.data?.length ?? 0;
  const numSheets = Math.ceil(numPages / 2) + 1;

  if (!allDocsQuery.data) return <LoadingPage />;

  const getPage = (page: number): DokuOrderPage =>
    page >= 0 && page < allDocsQuery.data.length
      ? allDocsQuery.data[page]
      : { type: 'blank' };

  console.log('current sheet: ', currentSheet);

  return (
    <div className="size-full flex flex-col p-4 gap-4">
      <div className="flex w-full justify-end items-center gap-2">
        <Button variant="outline" size="icon">
          <HugeiconsIcon icon={Expand} />
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-muted/40 p-3 shadow-soft sm:p-6">
        <motion.div
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="grid grid-cols-2 w-full gap-3 justify-center"
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
      </div>

      <div className="w-full flex justify-between items-center gap-2 p-2">
        <Button disabled={currentSheet === 0} onClick={prevSheet}>
          <HugeiconsIcon icon={ChevronLeft} /> Previous
        </Button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: numSheets }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentSheet ? 'w-6 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>
        <Button
          disabled={currentPage === allDocsQuery.data.length - 1}
          onClick={nextSheet}
        >
          <HugeiconsIcon icon={ChevronRight} /> Next
        </Button>
      </div>
    </div>
  );
};

export default DokuPage;
