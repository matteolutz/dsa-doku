import { useState, type FC } from 'react';
import type { DocCreationMethodCommonProps } from './types';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar,
  Check,
  Newspaper,
  Search,
  UserIcon
} from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type JournalArticle = {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
};

const journalArticles: JournalArticle[] = [
  {
    id: 'j1',
    title: 'Spieltheorie in der Praxis – Ein Erfahrungsbericht',
    author: 'Lena Hofmann',
    date: '12. Mai 2026',
    excerpt:
      'Über zwei Wochen voller Nash-Gleichgewichte, Bluffs und überraschender Allianzen am See.'
  },
  {
    id: 'j2',
    title: 'Good Morning, Sunshine!',
    author: 'Jonas Weber',
    date: '04. Mai 2026',
    excerpt:
      'Warum die Morgenroutine das Herzstück jeder Akademie ist – und wie wir sie neu erfunden haben.'
  },
  {
    id: 'j3',
    title: 'KüMu: Ein Tag in der Küchen­mann­schaft',
    author: 'Sarah Brandt',
    date: '28. April 2026',
    excerpt:
      'Zwischen 80 hungrigen Mägen und einer Prise Wahnsinn – ein Blick hinter die Kulissen.'
  },
  {
    id: 'j4',
    title: 'Strategien & Reflexion – Was bleibt?',
    author: 'Maximilian Götz',
    date: '21. April 2026',
    excerpt:
      'Wie aus zwei Wochen Intensiv-Programm bleibende Erkenntnisse für den Alltag werden.'
  }
];

export type DocJournalCreationProps = {} & DocCreationMethodCommonProps;

export const DocCreateJournalForm: FC<DocJournalCreationProps> = () => {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const filtered = journalArticles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
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

      <ul className="space-y-2">
        {filtered.map((a) => {
          const active = selectedArticle === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelectedArticle(a.id)}
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
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {a.excerpt}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <HugeiconsIcon icon={UserIcon} className="h-3 w-3" />{' '}
                      {a.author}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HugeiconsIcon icon={Calendar} className="h-3 w-3" />{' '}
                      {a.date}
                    </span>
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
        disabled={selectedArticle === null}
        type="submit"
        className="w-full"
        size="lg"
      >
        Erstellen
      </Button>
    </div>
  );
};
