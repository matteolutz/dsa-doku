import { ConversionInputFile, ConversionOutput } from './types';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

export const makeExecutableName = (executable: string) => {
  if (process.platform === 'win32') {
    return executable + '.exe';
  }
  return executable;
};

export const execFileAsync = promisify(execFile);

export const readInputFile = async (
  file: ConversionInputFile
): Promise<Buffer> => {
  if ('path' in file) {
    return fs.readFile(file.path);
  }

  return file.buffer;
};

export const splitPages = async (inputFilePath: string, outDir: string) => {
  if (process.platform === 'darwin') {
    // use gs on macOS
    await execFileAsync(makeExecutableName('gs'), [
      '-sDEVICE=pdfwrite',
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      '-sOutputFile=' + path.join(outDir, 'page-%03d.pdf'),
      inputFilePath
    ]);
  } else if (process.platform === 'linux' || process.platform == 'win32') {
    // use qpdf on linux and windows
    await execFileAsync(makeExecutableName('qpdf'), [
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
  return pageFiles.map((file) => ({ path: file }));
};
