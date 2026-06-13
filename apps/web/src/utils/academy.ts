import type { Academy, AcademyMeta } from '@repo/db/types';

export const formatAcademyName = (academy: Academy): string =>
  `${academy.location} ${academy.year}-${academy.yearIdx}`;

export const formatAcademyDateRange = (academy: Academy): string =>
  `${academy.tnBeginDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit'
  })} – ${academy.tnEndDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}`;

export const isAkaJournalEnabled = (academy: Academy): boolean =>
  typeof (academy.meta as AcademyMeta).akaJournal !== 'undefined';
