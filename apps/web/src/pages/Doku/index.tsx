import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { type DokuOrderPage } from './order';
import DokuPageRenderer from './page';
import { Button } from '@/components/ui/button';
import LoadingPage from '@/components/fm/loadingPage';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Print
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useAcademyDocsQuery } from './query';
import { useEffect, useEffectEvent, useState } from 'react';
import { useKey } from 'react-use';

const DokuPage = () => {
  const academyId = useSelectedAcademy();
  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId })
  );

  const navigate = useNavigate();

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const allDocsQuery = useAcademyDocsQuery(
    academyId,
    academyQuery.data ?? null
  );

  const numPages = allDocsQuery.data?.length ?? 0;
  const numSheets = Math.floor(numPages / 2) + 1;

  const [searchParams, setSearchParams] = useSearchParams();
  const currentSheet = Number(searchParams.get('p') ?? '0');
  const setCurrentSheet = (p: number) => {
    searchParams.set('p', p.toString());
    setSearchParams(searchParams);
  };
  const nextSheet = () =>
    setCurrentSheet(Math.min(currentSheet + 1, numSheets - 1));
  const prevSheet = () => setCurrentSheet(Math.max(0, currentSheet - 1));

  useKey('ArrowRight', () => nextSheet(), {}, [nextSheet]);
  useKey('ArrowLeft', () => prevSheet(), {}, [prevSheet]);

  const goToPage = (page: number) =>
    setCurrentSheet(Math.floor((page - 1) / 2) + 1);

  const resetCurrentSheet = useEffectEvent(() => setCurrentSheet(0));
  useEffect(() => resetCurrentSheet(), [academyId]);

  const currentPage = (currentSheet - 1) * 2 + 1;

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef?.requestFullscreen();
    }
  };

  if (!allDocsQuery.data) return <LoadingPage />;

  const getPage = (page: number): DokuOrderPage =>
    page >= 0 && page < allDocsQuery.data.length
      ? allDocsQuery.data[page]
      : { type: 'blank' };

  return (
    <div className="size-full flex flex-col p-4 gap-4">
      <div className="flex w-full justify-end items-center gap-2">
        <Button onClick={toggleFullscreen} variant="outline" size="icon">
          <HugeiconsIcon icon={Expand} />
        </Button>

        <Button
          onClick={() => navigate('/print/doku')}
          variant="outline"
          size="icon"
        >
          <HugeiconsIcon icon={Print} />
        </Button>
      </div>

      <div
        ref={setContainerRef}
        className="group rounded-3xl border border-border bg-muted fullscreen:bg-[#323232] p-3 shadow-soft sm:p-6"
      >
        <div className="group-fullscreen:h-full group-fullscreen:flex grid grid-cols-2 w-full gap-3 justify-center">
          {currentPage > 0 && (
            <DokuPageRenderer
              context={{ goToPage }}
              side="left"
              page={getPage(currentPage)}
              absolutePageIndex={currentPage}
            />
          )}

          <DokuPageRenderer
            context={{ goToPage }}
            side="right"
            page={getPage(currentPage + 1)}
            absolutePageIndex={currentPage + 1}
          />
        </div>
      </div>

      <div className="w-full flex justify-between items-center gap-2 p-2">
        <Button disabled={currentSheet === 0} onClick={prevSheet}>
          <HugeiconsIcon icon={ChevronLeft} /> Vorige Seite
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
        <Button disabled={currentSheet === numSheets - 1} onClick={nextSheet}>
          <HugeiconsIcon icon={ChevronRight} /> Nächste Seite
        </Button>
      </div>
    </div>
  );
};

export default DokuPage;
