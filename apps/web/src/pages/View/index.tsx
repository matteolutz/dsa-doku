import { pdfjs } from 'react-pdf';
import pdfWorker from '/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/TextLayer.css';
import { useQuery } from '@tanstack/react-query';
import { trpc, useSelectedAcademy } from '@/utils/trpc';
import HTMLFlipBook from 'react-pageflip';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const ViewPage = () => {
  const academyId = useSelectedAcademy();
  const docs = useQuery(trpc.doc.getAll.queryOptions({ academyId }));
  console.log(docs.data);

  /*
  const docNonceQuery = useQuery(
    trpc.doc.getDocNonce.queryOptions({
      docId: 'ac6b6ba0-b7fd-403e-9ee4-41752011671d'
    })
  );

  const docUrl = docNonceQuery.data
    ? apiUrl(`fs/doc?nonce=${docNonceQuery.data}&page=0`)
    : null;

    console.log(docUrl);*/

  return (
    <div className="size-full">
      {/* @ts-expect-error this is what the docs say */}
      <HTMLFlipBook width={300} height={400}>
        <div className="bg-red-500">Page 1</div>
        <div className="bg-red-500">Page 2</div>
        <div className="bg-red-500">Page 3</div>
        <div className="bg-red-500">Page 4</div>
      </HTMLFlipBook>
    </div>
  );
};

export default ViewPage;
