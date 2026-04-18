import { ReorderList } from '@/components/shadix-ui/components/reorder-list';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle
} from '@/components/ui/item';
import { trpc } from '@/utils/trpc';
import { Delete } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { DocumentType } from '@repo/db/types';
import { useQuery } from '@tanstack/react-query';
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

  if (typeof documentsQuery.data === 'undefined') return null;

  return (
    <div className="w-full flex flex-col gap-2">
      <ReorderList itemClassName="rounded-lg" withDragHandle>
        {documentsQuery.data.map((doc) => (
          <Item variant="outline" size="sm" key={doc.id}>
            <ItemContent>
              <ItemTitle>{doc.title}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="destructive" size="icon">
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
