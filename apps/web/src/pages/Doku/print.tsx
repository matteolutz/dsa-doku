import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useAcademyDocsQuery } from './query';
import LoadingPage from '@/components/fm/loadingPage';
import DokuPageRenderer from './page';
import { useEffect, useRef } from 'react';

const DokuPrintPage = () => {
  const academyId = useSelectedAcademy();
  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId })
  );
  const allDocsQuery = useAcademyDocsQuery(
    academyId,
    academyQuery.data ?? null
  );

  const pagesLoaded = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (allDocsQuery.data) {
      pagesLoaded.current.clear();
    }
  }, [allDocsQuery.data]);

  const pageLoaded = (i: number) => {
    pagesLoaded.current.add(i);

    if (
      allDocsQuery.data &&
      pagesLoaded.current.size === allDocsQuery.data.length
    ) {
      // pretty hacky, but works kind of reliably
      // after all pdf renderers have notified, that they have finished loading
      // they somehow still need a bit of time to render before we can take the print snapshot
      setTimeout(() => window.print(), 1000);
    }
  };

  if (!allDocsQuery.data) return <LoadingPage />;

  return (
    <div className="w-[210mm] flex-col">
      {allDocsQuery.data.map((page, i) => (
        <div className="w-full break-after-page overflow-hidden">
          <DokuPageRenderer
            context={{ goToPage: () => {} }}
            side="left"
            page={page}
            absolutePageIndex={i}
            onLoad={() => pageLoaded(i)}
          />
        </div>
      ))}
    </div>
  );
};

export default DokuPrintPage;
