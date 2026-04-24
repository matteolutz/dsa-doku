import { useState, type FC } from 'react';
import type { DokuOrderPage, DokuTocRootEntry } from './order';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { apiUrl } from '@/utils/api';
import { useMeasure } from 'react-use';

import { pdfjs, Document, Page } from 'react-pdf';
import pdfWorker from '/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Spinner } from '@/components/ui/spinner';

import dsaLogo from '@/assets/logos/dsa.png';
import { motion } from 'framer-motion';

export type DokuPageContext = {
  goToPage: (page: number) => void;
};

export type DokuPageProps = {
  page: DokuOrderPage;
  absolutePageIndex?: number;
  side: 'left' | 'right';
  context: DokuPageContext;
};

const DokuPageRenderer: FC<DokuPageProps> = ({
  page,
  absolutePageIndex,
  side,
  context
}) => {
  const [containerRef, { width: containerWidth }] =
    useMeasure<HTMLDivElement>();

  const renderPage = () => {
    switch (page.type) {
      case 'file-page':
        return (
          <DokuPageFile
            containerWidth={containerWidth}
            docId={page.docId}
            pageIndex={page.pageIndex}
          />
        );
      case 'blank':
        return <div></div>;
      case 'cover':
        return <DokuPageCover academyId={page.academyId} />;
      case 'toc':
        return <DokuPageToc context={context} entries={page.entries} />;
      default:
        return null;
    }
  };

  const shouldHaveInsetShadow = true;

  return (
    <motion.div
      layout
      key={side}
      initial={side === 'left' ? { x: -100, opacity: 0 } : undefined}
      animate={side === 'left' ? { x: 0, opacity: 1 } : undefined}
      exit={side === 'left' ? { x: -100, opacity: 0 } : undefined}
      className="aspect-210/297 w-full max-w-200 bg-white relative"
      style={{
        boxShadow: `${shouldHaveInsetShadow ? 'inset -15px -2px 20px 0px #dedbdb8b, ' : ''}0 0 12px 5px #dedbdb`
      }}
      ref={containerRef}
    >
      {renderPage()}
      {typeof absolutePageIndex !== 'undefined' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          {absolutePageIndex + 1}
        </div>
      )}
    </motion.div>
  );
};

export default DokuPageRenderer;

const DokuPageFile: FC<{
  docId: string;
  pageIndex: number;
  containerWidth: number;
}> = ({ docId, pageIndex, containerWidth }) => {
  const [loading, setLoading] = useState(true);

  const docNonceQuery = useQuery(
    trpc.doc.getDocNonce.queryOptions(
      {
        docId
      },
      {
        staleTime: 1000 * 60 * 4 // 4 minutes (token should last 5)
      }
    )
  );

  const pageUrl = docNonceQuery.data
    ? apiUrl(`fs/doc?nonce=${docNonceQuery.data}&page=${pageIndex}`)
    : null;

  return (
    <>
      {loading && (
        <div className="absolute bg-white top-0 left-0 size-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
      <Document file={pageUrl} onLoadSuccess={() => setLoading(false)}>
        <Page pageNumber={1} width={containerWidth} />
      </Document>
    </>
  );
};

const DokuPageCover: FC<{ academyId: number }> = ({ academyId }) => {
  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId })
  );

  if (!academyQuery.data) return null;

  return (
    <div
      className="relative flex w-full flex-col bg-white px-16 py-20"
      style={{ aspectRatio: '1 / 1.414' }}
    >
      {/* Header logo */}
      <div className="mb-28">
        <img className="h-15" src={dsaLogo} />
      </div>

      {/* Title */}
      <h1 className="text-center font-sans text-[40px] font-bold text-[#0B1220]">
        Deutsche SchülerAkademie
      </h1>

      {/* Subtitle */}
      <div className="mt-24 text-center font-sans text-[20px] font-bold text-[#0B1220]">
        <p>Dokumentation</p>
        <p>
          Akademie {academyQuery.data.location} {academyQuery.data.year}-
          {academyQuery.data.yearIdx}
        </p>
      </div>

      {/* Date / Location */}
      <div className="mt-24 text-center text-[16px] leading-relaxed text-[#0B1220] font-serif">
        <p>
          {academyQuery.data.tnBeginDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit'
          })}{' '}
          –{' '}
          {academyQuery.data.tnEndDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>
        <p>in der Jugendbildungsstätte</p>
        <p>Marstall Clemenswerth</p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-24 text-center text-[15px] text-[#0B1220] font-serif">
        Bildung & Begabung gemeinnützige gGmbH
      </div>
    </div>
  );
};

const DokuPageToc: FC<{
  entries: DokuTocRootEntry[];
  context: DokuPageContext;
}> = ({ entries, context }) => {
  return (
    <div className="flex flex-col gap-10 px-16 py-20">
      {entries.map((entry) => (
        <div className="flex flex-col gap-1.5">
          <div
            onClick={() => context.goToPage(entry.pageIndex)}
            className="cursor-pointer flex items-end gap-2"
          >
            <span className="whitespace-pre-line text-[15px] font-semibold leading-snug">
              {entry.name}
            </span>
            <span
              aria-hidden
              className="mb-1.25 flex-1 border-b border-dotted border-current/60"
            />
            <span className="whitespace-nowrap text-[13px]">
              S.&nbsp;{entry.pageIndex + 1}
            </span>
          </div>
          {entry.children.map((childEntry) => (
            <div
              onClick={() => context.goToPage(childEntry.pageIndex)}
              className="cursor-pointer flex items-end gap-2"
            >
              <span className="truncate text-[13px] leading-snug">
                {childEntry.name}
              </span>
              <span
                aria-hidden
                className="mb-1 flex-1 border-b border-dotted border-current/60"
              />
              <span className="whitespace-nowrap text-[13px]">
                S.&nbsp;{childEntry.pageIndex + 1}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
