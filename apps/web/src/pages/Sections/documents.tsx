import { ReorderList } from '@/components/shadix-ui/components/reorder-list';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemTitle } from '@/components/ui/item';
import { trpc } from '@/utils/trpc';
import type { DocumentType } from '@repo/db/types';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { Link } from 'react-router';

export type AbstractDocumentsProps = {
  documentType: DocumentType;
};

const AbstractDocuments: FC<AbstractDocumentsProps> = ({ documentType }) => {
  const documentsQuery = useQuery(
    trpc.doc.getAll.queryOptions({
      documentType
    })
  );

  if (typeof documentsQuery.data === 'undefined') return null;

  return (
    <div className="w-full flex flex-col gap-2">
      <ReorderList itemClassName="rounded-lg" withDragHandle>
        {documentsQuery.data.map((doc) => (
          <Item variant="outline" size="sm" key={doc.name}>
            <ItemContent>
              <ItemTitle>{doc.name}</ItemTitle>
            </ItemContent>
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
