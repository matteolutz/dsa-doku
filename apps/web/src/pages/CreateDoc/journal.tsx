import { useState, type FC } from 'react';
import type { DocCreationMethodCommonProps } from './types';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar,
  Check,
  Newspaper,
  Reload,
  Search,
  UserIcon
} from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, trpc } from '@/utils/trpc';
import LoadingPage from '@/components/fm/loadingPage';
import { SanitizeHtml } from '@/components/fm/sanitizeHtml';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router';
import { fetchJournalPostBlocks } from '@/utils/journal';

const htmlSanitationOptions = {
  allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: {
    a: ['href']
  }
};

export type DocJournalCreationProps = {
  academyId: number;
} & DocCreationMethodCommonProps;

export const DocCreateJournalForm: FC<DocJournalCreationProps> = ({
  academyId,
  docType
}) => {
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const journalPostsQuery = useQuery(
    trpc.journal.getPostsWithUserNames.queryOptions({ academyId })
  );
  const journalPosts = journalPostsQuery.data ?? null;

  const createJournalDocMutation = useMutation(
    trpc.doc.createJournal.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.doc.getAll.queryKey()
        })
    })
  );

  const submit = async () => {
    if (selectedPost === null || isSubmitting) return;
    setIsSubmitting(true);

    const { post, pages } = await fetchJournalPostBlocks(
      selectedPost,
      academyId
    );

    await createJournalDocMutation.mutateAsync({
      wpPostId: post.id,
      wpPostLink: post.link,
      wpPostLastModified: post.modified,
      wpBlocks: pages,

      title: post.title.rendered,

      documentType: docType
    });

    navigate('/sections');
  };

  if (journalPosts === null) return <LoadingPage />;

  console.log('journalPosts', journalPosts);

  const filtered = journalPosts.filter(
    (a) =>
      a.title.rendered.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.rendered.toLocaleLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="w-full flex gap-2 items-center">
        {/* Search */}
        <div className="w-full relative">
          <HugeiconsIcon
            icon={Search}
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Artikel im Aka Journal suchen…"
            className="w-full pl-11"
          />
        </div>

        <Button
          disabled={journalPostsQuery.isFetching}
          onClick={() => journalPostsQuery.refetch()}
          size="sm"
          variant="outline"
        >
          {journalPostsQuery.isFetching ? (
            <Spinner />
          ) : (
            <HugeiconsIcon icon={Reload} />
          )}
        </Button>
      </div>

      <ul className="space-y-2">
        {filtered.map((a) => {
          const active = selectedPost === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelectedPost(a.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border bg-background/60 p-4 text-left transition ${
                  active
                    ? 'border-primary/60 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary-soft text-primary'
                  }`}
                >
                  <HugeiconsIcon icon={Newspaper} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    <SanitizeHtml
                      dirty={a.title.rendered}
                      options={htmlSanitationOptions}
                    />
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    <SanitizeHtml
                      dirty={a.excerpt.rendered}
                      options={htmlSanitationOptions}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {a.authorName && (
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={UserIcon} className="h-3 w-3" />{' '}
                        {a.authorName}
                      </span>
                    )}
                    {a.date && (
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={Calendar} className="h-3 w-3" />{' '}
                        {new Date(a.date).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                    <Button
                      onClick={(e) => e.stopPropagation()}
                      asChild
                      className="m-0 p-0 text-[11px]"
                      size="sm"
                      variant="link"
                    >
                      <a target="_blank" href={a.link}>
                        Ansehen
                      </a>
                    </Button>
                  </div>
                </div>
                {active && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <HugeiconsIcon
                      icon={Check}
                      className="h-3 w-3"
                      strokeWidth={3}
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-background/40 p-6 text-center text-sm text-muted-foreground">
            Keine Artikel gefunden.
          </li>
        )}
      </ul>

      <Button
        onClick={submit}
        disabled={selectedPost === null || isSubmitting}
        type="submit"
        className="w-full"
        size="lg"
      >
        {isSubmitting && <Spinner />} Erstellen
      </Button>
    </div>
  );
};
