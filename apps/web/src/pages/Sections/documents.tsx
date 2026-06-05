import { ReorderList } from '@/components/shadix-ui/components/reorder-list';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { useConfirmationModalContext } from '@/hooks/modal';
import { queryClient, trpc } from '@/utils/trpc';
import { Delete, File, Plus } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Document, DocumentType } from '@repo/db/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { Link } from 'react-router';

export type AbstractDocumentsProps = {
  documentType: DocumentType;
};

const AbstractDocuments: FC<AbstractDocumentsProps> = ({ documentType }) => {
  const documentsQuery = useQuery(
    trpc.doc.getAllOfType.queryOptions({
      documentType
    })
  );

  const deleteDocumentMutation = useMutation(
    trpc.doc.delete.mutationOptions({
      onSuccess: () => {
        console.log('invalidating');
        return queryClient.invalidateQueries({
          queryKey: trpc.doc.getAllOfType.queryKey({ documentType })
        });
      }
    })
  );

  const reorderDocumentsMutation = useMutation(
    trpc.doc.reorder.mutationOptions({
      onSuccess: () => {
        return queryClient.invalidateQueries({
          queryKey: trpc.doc.getAllOfType.queryKey({ documentType })
        });
      }
    })
  );

  const modalContext = useConfirmationModalContext();

  const deleteDocument = async (doc: Document) => {
    const result = await modalContext.showConfirmation({
      title: 'Dokument löschen?',
      message: `Möchtest Du das Dokument "${doc.title}" wirklich löschen?`,
      confirmButtonText: 'Löschen',
      confirmButtonVariant: 'destructive'
    });

    if (!result) return;
    await deleteDocumentMutation.mutateAsync({ docId: doc.id });
  };

  // handle the reordering of documents. the new order is given as
  // an array of document ids in the new order.
  const handleDocumentReorder = (newOrder: string[]) => {
    const docs = documentsQuery.data;
    if (typeof docs === 'undefined') return;

    reorderDocumentsMutation.mutate({ newOrder, docType: documentType });

    // optimistically update our local state
    const newDocs = [...docs];
    for (const doc of newDocs) {
      const newSortOrder = newOrder.indexOf(doc.id) ?? doc.sortOrder;
      doc.sortOrder = newSortOrder;
    }
    newDocs.sort((a, b) => a.sortOrder - b.sortOrder);

    queryClient.setQueryData(
      trpc.doc.getAllOfType.queryKey({ documentType }),
      () => newDocs
    );
  };

  if (typeof documentsQuery.data === 'undefined') return null;

  console.log(documentType, documentsQuery.data);

  return (
    <div className="w-full flex flex-col gap-3">
      <ReorderList
        onReorderFinish={(newOrder) =>
          handleDocumentReorder(
            newOrder
              .map(
                (node) => (node.props as Record<string, unknown>)['data-docId']
              )
              .filter((id) => typeof id === 'string')
          )
        }
        itemClassName="rounded-lg"
        withDragHandle
      >
        {documentsQuery.data.map((doc) => (
          <Item data-docId={doc.id} variant="outline" size="xs" key={doc.id}>
            <ItemMedia>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <HugeiconsIcon icon={File} className="h-4 w-4" />
              </div>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{doc.title}</ItemTitle>
            </ItemContent>
            <ItemActions>
              {documentsQuery.isFetching && <Spinner />}
              <Button
                onClick={() => deleteDocument(doc)}
                variant="destructive"
                size="icon"
              >
                <HugeiconsIcon icon={Delete} />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ReorderList>

      {documentsQuery.data?.length === 0 && (
        <div className="mb-2 text-center">
          <p className="rounded-2xl border border-dashed border-border bg-background/40 p-6 text-center text-sm text-muted-foreground">
            Keine Dokumente gefunden.
          </p>
        </div>
      )}

      <Button size="lg" asChild>
        <Link to={`/doc/create?t=${btoa(JSON.stringify(documentType))}`}>
          <HugeiconsIcon icon={Plus} />
          Hinzufügen
        </Link>
      </Button>
    </div>
  );
};

export default AbstractDocuments;
