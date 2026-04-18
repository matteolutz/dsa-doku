import path from 'path';
import { ConversionInput, ConversionOutput } from '../types';
import fs from 'fs/promises';
import { splitPages } from '../utils';

export const pdfConversionFn = async (
  input: ConversionInput
): Promise<ConversionOutput> => {
  let filePath;
  if ('path' in input.file) {
    filePath = input.file.path;
  } else {
    filePath = path.join(input.options.tempDir, 'temp.pdf');
    await fs.writeFile(filePath, input.file.buffer);
  }

  const pages = await splitPages(filePath, input.options.outDir);
  return { pages, headings: {} };
};
