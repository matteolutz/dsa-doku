import JSZip from 'jszip';
import { ConversionInput, ConversionOutput } from '../types';
import { execFileAsync, readInputFile, splitPages } from '../utils';
import { DOMParser, XMLSerializer } from 'xmldom';
import fs from 'fs/promises';
import path from 'path';
import OfficeParser from 'officeparser';

// this code is very ugly
// will be cleaned up in a future commit :)

export const docxConversionFn = async (
  input: ConversionInput
): Promise<ConversionOutput> => {
  const inputBuffer = readInputFile(input.file);
  const zip = await JSZip.loadAsync(inputBuffer);

  // page number adjustment
  const docXmlPath = 'word/document.xml';
  const xmlContent = await zip.file(docXmlPath)!.async('text');

  const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');

  if (input.removePageNumbers) {
    // TODO: remove page numbers
  }

  const updatedXml = new XMLSerializer().serializeToString(doc);
  zip.file(docXmlPath, updatedXml);

  const newDocx = await zip.generateAsync({ type: 'nodebuffer' });
  const newDocxPath = path.join(input.options.tempDir, 'temp.docx');
  await fs.writeFile(newDocxPath, newDocx);

  const ast = await OfficeParser.parseOffice(newDocxPath);
  await fs.writeFile(
    path.join(input.options.outDir, 'test.json'),
    JSON.stringify(ast, null, 2)
  );

  // convert docx to pdf
  await execFileAsync('soffice', [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    input.options.tempDir,
    newDocxPath
  ]);

  const pages = await splitPages(
    path.join(input.options.tempDir, 'temp.pdf'),
    input.options.outDir
  );

  return { pages, headings: {} };
};
