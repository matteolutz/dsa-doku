import path from 'path';
import {
  ConversionFnOptions,
  ConversionInput,
  ConversionOutput
} from '../types';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { splitPages } from '../utils';

export const execFileAsync = promisify(execFile);

type Sections = {
  number: string;
  title: string;
  page: number;
}[];

const SECTIONS_INJECT = String.raw`\RequirePackage{etoolbox}

% Create output file
\newwrite\jsonfile
\immediate\openout\jsonfile=\jobname-sections.json

% Write JSON header
\immediate\write\jsonfile{[}

\newif\iffirstentry
\firstentrytrue

% Patch the section command
\makeatletter
\apptocmd{\@xsect}
  {
    \iffirstentry
      \global\firstentryfalse
    \else
      \immediate\write\jsonfile{,}%
    \fi

    \immediate\write\jsonfile{    \string{
        "number": "\thesection",
        "title": "\@currentlabelname",
        "page": \thepage
    \string}}
  }
  {}{}
\makeatother


% Hook to close JSON at end of document
\AtEndDocument{%
    \immediate\write\jsonfile{]}%
    \immediate\closeout\jsonfile%
}`;

export const texConversionFn = async (
  input: ConversionInput,
  options?: ConversionFnOptions
): Promise<ConversionOutput> => {
  if (!('path' in input.file)) throw new Error('LaTeX input must be a path');

  const parentDir = path.dirname(input.file.path);
  const textFileName = path.basename(input.file.path);
  const texJobName = path.basename(input.file.path, '.tex');

  options?.onProgress?.({ progress: 0, message: 'Reading LaTeX file' });
  const texFileContents = await fs.readFile(input.file.path, 'utf8');

  options?.onProgress?.({
    progress: 0.2,
    message: 'Injecting sections JSON injection'
  });
  // add injection
  const sectionsInjectionName = `sections-to-json-${Math.floor(Math.random() * 1000000)}.tex`;
  await fs.writeFile(
    path.join(parentDir, sectionsInjectionName),
    SECTIONS_INJECT
  );

  const replacedContent = texFileContents.replace(
    /(\\documentclass(?:\[[^\]]*\])?\{[^\}]+\})/,
    `$1\n\\input{${sectionsInjectionName}}`
  );
  await fs.writeFile(input.file.path, replacedContent);

  // compile 2 times (it's latex...)
  for (let i = 0; i < 2; i++) {
    options?.onProgress?.({
      progress: 0.4 + i * 0.2,
      message: `Running compilation no. ${i + 1}`
    });
    try {
      await execFileAsync('lualatex', [textFileName], {
        cwd: parentDir
      });
    } catch (e) {
      // ignroe any errors
      console.warn('lualatex failed (ignoring):', e);
    }
  }

  const pdfFileName = texJobName + '.pdf';
  const pdfFile = path.join(parentDir, pdfFileName);

  options?.onProgress?.({
    progress: 0.7,
    message: `Reading sections JSON`
  });
  const sectionsFile = path.join(parentDir, `${texJobName}-sections.json`);
  const sections = JSON.parse(
    await fs.readFile(sectionsFile, 'utf8')
  ) as Sections;

  options?.onProgress?.({
    progress: 0.9,
    message: `Splitting PDF pages`
  });
  const pages = await splitPages(pdfFile, input.options.outDir);

  return {
    pages,
    headings: sections.map((section) => ({
      text: `${section.number} ${section.title}`,
      pageOffset: section.page - 1
    }))
  };
};
