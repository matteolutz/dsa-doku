import JSZip from 'jszip';
import { ConversionInput, ConversionOutput } from '../types';
import { execFileAsync, readInputFile, splitPages } from '../utils';
import { DOMParser, XMLSerializer } from 'xmldom';
import xpath from 'xpath';
import fs from 'fs/promises';
import path from 'path';

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

  if (input.preferredStartingPageNumber !== null) {
    const select = xpath.useNamespaces({
      w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    });

    const sectPrNodes = select('//w:sectPr', doc);

    if (!Array.isArray(sectPrNodes)) throw new Error('Invalid w:sectPr found');

    if (sectPrNodes.length !== 1)
      throw new Error('Invalid number of w:sectPr found');

    const sectPr = sectPrNodes[0]!;
    const pgNumTypes = select('w:pgNumType', sectPr);

    if (!Array.isArray(pgNumTypes))
      throw new Error('Invalid w:pgNumType found');

    let pgNumType = pgNumTypes[0];

    if (!pgNumType) {
      pgNumType = doc.createElement('w:pgNumType');
      sectPr.appendChild(pgNumType);
    }

    // @ts-ignore
    pgNumType.setAttribute('w:start', input.preferredStartingPageNumber);
  }

  const updatedXml = new XMLSerializer().serializeToString(doc);
  zip.file(docXmlPath, updatedXml);

  const newDocx = await zip.generateAsync({ type: 'nodebuffer' });
  const newDocxPath = path.join(input.options.tempDir, 'temp.docx');
  await fs.writeFile(newDocxPath, newDocx);

  // convert docx to pdf
  await execFileAsync('soffice', [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    input.options.tempDir,
    newDocxPath
  ]);

  return splitPages(
    path.join(input.options.tempDir, 'temp.pdf'),
    input.options.outDir
  );
};
