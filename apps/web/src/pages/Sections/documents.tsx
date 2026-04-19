import { ReorderList } from '@/components/shadix-ui/components/reorder-list';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle
} from '@/components/ui/item';
import { useConfirmationModalContext } from '@/hooks/modal';
import { queryClient, trpc } from '@/utils/trpc';
import { Delete } from '@hugeicons/core-free-icons';
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

  if (typeof documentsQuery.data === 'undefined') return null;

  console.log(documentType, documentsQuery.data);

  return (
    <div className="w-full flex flex-col gap-2">
      <ReorderList itemClassName="rounded-lg" withDragHandle>
        {documentsQuery.data.map((doc) => (
          <Item variant="outline" size="sm" key={doc.id}>
            <ItemContent>
              <ItemTitle>{doc.title}</ItemTitle>
            </ItemContent>
            <ItemActions>
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
      <Button asChild>
        <Link to={`/doc/create?t=${btoa(JSON.stringify(documentType))}`}>
          Hinzufügen
        </Link>
      </Button>
    </div>
  );
};

export default AbstractDocuments;
