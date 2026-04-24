import { docxConversionFn } from './formats/docx';
import { pdfConversionFn } from './formats/pdf';
import { texConversionFn } from './formats/tex';
import { ConversionFn } from './types';

export const MIME_TYPE_MAP: Record<string, ConversionFn> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    docxConversionFn,
  'application/pdf': pdfConversionFn,
  'application/x-tex': texConversionFn
};
