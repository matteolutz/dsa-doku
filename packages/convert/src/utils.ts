import { ConversionInputFile, ConversionOutput } from './types';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

export const execFileAsync = promisify(execFile);

export const readInputFile = async (
  file: ConversionInputFile
): Promise<Buffer> => {
  if ('path' in file) {
    return fs.readFile(file.path);
  }

  return file.buffer;
};

export const splitPages = async (
  inputFilePath: string,
  outDir: string
): Promise<ConversionOutput> => {
  if (process.platform === 'darwin') {
    await execFileAsync('gs', [
      '-sDEVICE=pdfwrite',
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      '-sOutputFile=' + path.join(outDir, 'page-%03d.pdf'),
      inputFilePath
    ]);
  } else if (process.platform === 'linux') {
    // use qpdf
    await execFileAsync('qpdf', [
      '--split-pages=1',
      inputFilePath,
      path.join(outDir, 'page-%03d.pdf')
    ]);
  } else {
    throw new Error('Unsupported platform');
  }

  const pageFiles = await Array.fromAsync(
    fs.glob(path.join(outDir, 'page-*.pdf'))
  );
  return { pages: pageFiles.map((file) => ({ path: file })) };
};
