import { FileArchive, FileText, Newspaper } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import type { DocumentType } from '@repo/db/types';

export const ALL_DOC_CREATION_VARIANTS = [
  'docx',
  'latex',
  'aka-journal'
] as const;
export type DocCreationVariant = (typeof ALL_DOC_CREATION_VARIANTS)[number];

export type DocCreationMethod = {
  title: string;
  description: string;
  icon: IconSvgElement;

  // File upload only
  fileConfig?: {
    accept: string;
    uploadHint: string;
  };
};

export const DOC_CREATION_METHODS: Record<
  DocCreationVariant,
  DocCreationMethod
> = {
  docx: {
    title: 'Word-Dokument',
    description: 'Lade eine .docx Datei hoch',
    icon: FileText,
    fileConfig: {
      accept: '.docx',
      uploadHint: '.docx - max. 20 MB'
    }
  },
  latex: {
    title: 'LaTeX Projekt',
    description: 'Lade ein ZIP-Archiv mit LaTeX-Quellen hoch.',
    icon: FileArchive,
    fileConfig: {
      accept: '.zip',
      uploadHint: '.zip - enthält main.tex Dateien'
    }
  },
  'aka-journal': {
    title: 'Aka Journal',
    description: 'Wähle einen Artikel aus dem Aka Journal.',
    icon: Newspaper
  }
};

export type DocCreationMethodCommonProps = {
  docType: DocumentType;

  setProgress: (progress: { progress: number; message: string }) => void;
  currentProgress: { progress: number; message: string } | null;
};
