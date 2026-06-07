import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useAcademyDocsQuery } from './query';
import LoadingPage from '@/components/fm/loadingPage';
import DokuPageRenderer from './page';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { formatAcademyName } from '@/utils/academy';
import { Spinner } from '@/components/ui/spinner';

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

  const navigate = useNavigate();

  useEffect(() => {
    if (allDocsQuery.data) {
      pagesLoaded.current.clear();
    }
  }, [allDocsQuery.data]);

  useEffect(() => {
    if (!academyQuery.data) return;
    document.title = `Dokumentation ${formatAcademyName(academyQuery.data)}`;
  }, [academyQuery.data]);

  const doPrint = () => {
    window.print();
    navigate(-1);
  };

  const pageLoaded = (i: number) => {
    pagesLoaded.current.add(i);

    if (
      allDocsQuery.data &&
      pagesLoaded.current.size === allDocsQuery.data.length
    ) {
      // pretty hacky, but works kind of reliably
      // after all pdf renderers have notified, that they have finished loading
      // they somehow still need a bit of time to render before we can take the print snapshot
      setTimeout(() => doPrint(), 2000);
    }
  };

  if (!allDocsQuery.data) return <LoadingPage />;

  return (
    <>
      <div className="print:hidden z-10 fixed bg-background top-0 left-0 size-full flex gap-2 flex-col justify-center items-center">
        <Spinner />
        <p>Deine Dokumentation wird gerade zusammengesetzt...</p>
      </div>
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
    </>
  );
};

export default DokuPrintPage;
