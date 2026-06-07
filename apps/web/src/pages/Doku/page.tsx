import { useEffect, useState, type FC } from 'react';
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
import { formatAcademyDateRange } from '@/utils/academy';
import type { WpBlock } from '@repo/db/types';
import { JournalAudioPlayer } from './wp/audio';

export type DokuPageContext = {
  goToPage: (page: number) => void;
};

export type DokuPageProps = {
  page: DokuOrderPage;
  absolutePageIndex?: number;
  side: 'left' | 'right';
  context: DokuPageContext;

  onLoad?: () => void;
};

const DokuPageRenderer: FC<DokuPageProps> = ({
  page,
  absolutePageIndex,
  side,
  context,
  onLoad
}) => {
  const [containerRef, { width: containerWidth }] =
    useMeasure<HTMLDivElement>();

  useEffect(() => {
    if (page.type === 'blank') onLoad?.();
  }, [onLoad, page.type]);

  const renderPage = () => {
    switch (page.type) {
      case 'file-page':
        return (
          <DokuPageFile
            containerWidth={containerWidth}
            docId={page.docId}
            pageIndex={page.pageIndex}
            onLoad={onLoad}
          />
        );
      case 'wp-page':
        return <DokuWpPage wpBlocks={page.wpBlocks} onLoad={onLoad} />;
      case 'blank':
        return <div></div>;
      case 'cover':
        return <DokuPageCover academyId={page.academyId} onLoad={onLoad} />;
      case 'toc':
        return (
          <DokuPageToc
            context={context}
            entries={page.entries}
            onLoad={onLoad}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="aspect-210/297 w-full bg-white print:border-0 border border-border overflow-hidden rounded-xl relative @container"
      style={{
        gridColumn: side === 'left' ? 1 : 2
      }}
      ref={containerRef}
    >
      {renderPage()}
      {typeof absolutePageIndex !== 'undefined' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[2cqw]">
          {absolutePageIndex + 1}
        </div>
      )}
    </div>
  );
};

export default DokuPageRenderer;

const DokuWpMedia: FC<{
  media: NonNullable<WpBlock['media']>;
}> = ({ media }) => {
  switch (media.type) {
    case 'audio':
      return (
        <JournalAudioPlayer
          title="Test Audio"
          author="Matteo Lutz"
          src={media.src}
        />
      );
    default:
      return null;
  }
};

const DokuWpPage: FC<{
  wpBlocks: WpBlock[];
  onLoad?: () => void;
}> = ({ wpBlocks, onLoad }) => {
  useEffect(() => {
    if (onLoad) onLoad();
  }, [wpBlocks, onLoad]);

  return (
    <div className="size-full flex flex-col gap-[1cqw] px-[10cqw] py-[10cqw] overflow-hidden journal-wp-page">
      {wpBlocks.map((block, index) =>
        block.media ? (
          <DokuWpMedia media={block.media} />
        ) : (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: block.outerHTML }}
          />
        )
      )}
    </div>
  );
};

const DokuPageFile: FC<{
  docId: string;
  pageIndex: number;
  containerWidth: number;
  onLoad?: () => void;
}> = ({ docId, pageIndex, containerWidth, onLoad }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) onLoad?.();
  }, [loading, onLoad]);

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

const DokuPageCover: FC<{ academyId: number; onLoad?: () => void }> = ({
  academyId,
  onLoad
}) => {
  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId })
  );

  useEffect(() => {
    if (academyQuery.data) onLoad?.();
  }, [onLoad, academyQuery.data]);

  if (!academyQuery.data) return null;

  return (
    <div
      className="relative flex w-full flex-col bg-white px-[10cqw] py-[12cqw]"
      style={{ aspectRatio: '1 / 1.414' }}
    >
      {/* Header logo */}
      <div className="mb-[10cqw] h-[10cqw]">
        <img className="h-full" src={dsaLogo} />
      </div>

      {/* Title */}
      <h1 className="text-center font-sans text-[4cqw] font-bold text-[#0B1220]">
        Deutsche SchülerAkademie
      </h1>

      {/* Subtitle */}
      <div className="mt-[14cqw] text-center font-sans text-[3cqw] font-bold text-[#0B1220]">
        <p>Dokumentation</p>
        <p>
          Akademie {academyQuery.data.location} {academyQuery.data.year}-
          {academyQuery.data.yearIdx}
        </p>
      </div>

      {/* Date / Location */}
      <div className="mt-[14cqw] text-center text-[2cqw] leading-relaxed text-[#0B1220] font-serif">
        <p>{formatAcademyDateRange(academyQuery.data)}</p>
        <p>in der Jugendbildungsstätte</p>
        <p>Marstall Clemenswerth</p>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center text-[2cqw] text-[#0B1220] font-serif">
        Bildung & Begabung gemeinnützige gGmbH
      </div>
    </div>
  );
};

const DokuPageToc: FC<{
  entries: DokuTocRootEntry[];
  context: DokuPageContext;
  onLoad?: () => void;
}> = ({ entries, context, onLoad }) => {
  useEffect(() => onLoad?.(), [onLoad]);

  return (
    <div className="flex flex-col gap-[5cqw] px-[10cqw] py-[12cqw]">
      {entries.map((entry) => (
        <div className="flex flex-col gap-[0.2cqw]">
          <div
            onClick={() => context.goToPage(entry.pageIndex)}
            className="cursor-pointer flex items-end gap-[1cqw]"
          >
            <span className="whitespace-pre-line text-[3cqw] font-semibold leading-snug">
              {entry.name}
            </span>
            <span
              aria-hidden
              className="mb-1.25 flex-1 border-b border-dotted border-current/60"
            />
            <span className="whitespace-nowrap text-[2cqw]">
              S.&nbsp;{entry.pageIndex + 1}
            </span>
          </div>
          {entry.children.map((childEntry) => (
            <div
              onClick={() => context.goToPage(childEntry.pageIndex)}
              className="cursor-pointer flex items-end gap-[1cqw]"
            >
              <span className="truncate text-[2cqw] leading-snug">
                {childEntry.name}
              </span>
              <span
                aria-hidden
                className="mb-1 flex-1 border-b border-dotted border-current/60"
              />
              <span className="whitespace-nowrap text-[2cqw]">
                S.&nbsp;{childEntry.pageIndex + 1}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
