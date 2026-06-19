import { Computer, File } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import type { DocumentMeta } from '@repo/db/types';

export const getDocumentTypeIcon = (
  type: DocumentMeta['type']
): IconSvgElement => {
  switch (type) {
    case 'file':
      return File;
    case 'wp':
      return Computer;
  }
};

export const getDocumentTypeLabel = (type: DocumentMeta['type']) => {
  switch (type) {
    case 'file':
      return 'Datei';
    case 'wp':
      return 'Aka-Journal Beitrag';
  }
};
