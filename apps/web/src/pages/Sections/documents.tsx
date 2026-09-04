import { ReorderList } from '@/components/shadix-ui/components/reorder-list';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useConfirmationModalContext } from '@/hooks/modal';
import { fetchJournalPostBlocks } from '@/utils/journal';
import { queryClient, trpc } from '@/utils/trpc';
import {
  Delete,
  Plus,
  Refresh,
  ParagraphIcon,
  Edit
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
  Document,
  DocumentWpMeta,
  DocumentMeta,
  DocumentType
} from '@repo/db/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FC } from 'react';
import { Link } from 'react-router';
import { getDocumentTypeIcon, getDocumentTypeLabel } from './util';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';

export type AbstractDocumentsProps = {
  documentType: DocumentType;

  debug?: boolean;
};

const AbstractDocuments: FC<AbstractDocumentsProps> = ({
  documentType,
  debug = false
}) => {
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
        {documentsQuery.data.map((doc, idx) => (
          <Document
            doc={doc}
            deleteDocument={deleteDocument}
            documentType={documentType}
            isFetching={documentsQuery.isFetching}
            key={doc.id}
            isLastInSection={idx === documentsQuery.data.length - 1}
            debug={debug}
          />
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

const Document: FC<{
  doc: Document;
  deleteDocument: (doc: Document) => void;
  isFetching: boolean;
  documentType: DocumentType;
  isLastInSection: boolean;
  debug: boolean;
}> = ({
  doc,
  deleteDocument,
  isFetching,
  documentType,
  isLastInSection,
  debug
}) => {
  const updateWpPostMutation = useMutation(
    trpc.doc.updateJournal.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.journal.getPost.queryKey({
            wpPostId: (docMeta.meta as DocumentWpMeta).wpPostId
          })
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.doc.getAllOfType.queryKey({ documentType })
        });
      }
    })
  );

  const renameDocumentMutation = useMutation(
    trpc.doc.rename.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.doc.getAllOfType.queryKey({ documentType })
        });
      }
    })
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const updatePost = async () => {
    setIsUpdating(true);

    const { post, pages } = await fetchJournalPostBlocks(
      (docMeta.meta as DocumentWpMeta).wpPostId ?? 0,
      doc.academyId,
      { insertDocumentTitle: true, insertAuthors: true }
    );

    await updateWpPostMutation.mutateAsync({
      docId: doc.id,
      title: post.title.rendered,
      wpPostId: post.id,
      wpPostLastModified: post.modified,
      wpBlocks: pages,
      wpPostLink: post.link
    });
    setIsUpdating(false);
  };

  const docMeta = doc.meta as DocumentMeta;

  const wpPostQuery = useQuery(
    trpc.journal.getPost.queryOptions(
      {
        wpPostId: (docMeta.meta as DocumentWpMeta).wpPostId ?? 0,
        academyId: doc.academyId
      },
      {
        enabled: docMeta.type === 'wp'
      }
    )
  );

  const renameDocumentForm = useForm<{ title: string }>();
  const onRenameDocumentSubmit = async ({ title }: { title: string }) => {
    await renameDocumentMutation.mutateAsync({
      docId: doc.id,
      title
    });
  };

  const isOutdated =
    docMeta.type === 'wp' &&
    wpPostQuery.data?.post.modified !==
      (docMeta.meta as DocumentWpMeta).wpPostLastModified;

  return (
    <Item data-docId={doc.id} variant="outline" size="xs">
      <ItemMedia>
        {isLastInSection && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex size-5 items-center justify-center rounded-full border border-primary-soft text-primary">
                <HugeiconsIcon icon={ParagraphIcon} className="size-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Der Titel dieses Dokuments wird im Inhaltsverzeichnis angezeigt.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <HugeiconsIcon
            icon={getDocumentTypeIcon((doc.meta as DocumentMeta).type)}
            className="h-4 w-4"
          />
        </div>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <span>{doc.title}</span>
          {(doc.meta as DocumentMeta).type === 'file' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon-xs" variant="ghost">
                  <HugeiconsIcon icon={Edit} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="pr-2">
                    Dokument umbenennen
                  </DialogTitle>
                  <DialogDescription className="flex flex-col">
                    <span>Hier kannst du den Titel des Dokuments ändern.</span>
                    {isLastInSection && (
                      <span className="text-destructive text-xs">
                        Achtung: Der Titel dieses Dokuments wird aktuell zur
                        Anzeige im Inhaltsverzeichnis verwendet.
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={renameDocumentForm.handleSubmit(
                    onRenameDocumentSubmit
                  )}
                  className="grid gap-4"
                >
                  <Input
                    placeholder="Titel"
                    defaultValue={doc.title}
                    required
                    {...renameDocumentForm.register('title')}
                  />

                  <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                      <Button type="submit">Okay</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </ItemTitle>
        <ItemDescription className="text-xs">
          {getDocumentTypeLabel((doc.meta as DocumentMeta).type)}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="mr-10">
        {isFetching && <Spinner />}
        {(isOutdated || debug) && (
          <Button
            onClick={updatePost}
            disabled={isUpdating}
            variant="outline"
            size="sm"
          >
            {isUpdating ? <Spinner /> : <HugeiconsIcon icon={Refresh} />}
          </Button>
        )}
        <Button
          onClick={() => deleteDocument(doc)}
          variant="destructive"
          size="icon"
        >
          <HugeiconsIcon icon={Delete} />
        </Button>
      </ItemActions>
    </Item>
  );
};
