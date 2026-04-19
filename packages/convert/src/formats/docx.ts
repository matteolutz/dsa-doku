import JSZip from 'jszip';
import { ConversionInput, ConversionOutput } from '../types';
import { execFileAsync, readInputFile, splitPages } from '../utils';
import { DOMParser, XMLSerializer } from 'xmldom';
import fs from 'fs/promises';
import path from 'path';
import OfficeParser, { BreakMetadata, OfficeParserAST } from 'officeparser';

const HEADING_REGEX = /^(\d+(?:\.\d+)*\.?)\s?(.+)$/;

class OfficeTraverser {
  private _currentPage = 0;

  constructor(public readonly ast: OfficeParserAST) {}

  private _handleBreak(metadata: BreakMetadata) {
    if (metadata.breakType === 'page') {
      this._currentPage++;
    }
  }

  *traverse() {
    for (const n of this.ast.content) {
      switch (n.type) {
        case 'paragraph':
          for (const c of n.children!) {
            if (c.type === 'break') {
              this._handleBreak(c.metadata as BreakMetadata);
            }
          }
          break;
        case 'break':
          this._handleBreak(n.metadata as BreakMetadata);
          break;
        default:
          break;
      }

      yield n;
    }
  }

  get currentPage() {
    return this._currentPage;
  }
}

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

  const ast = await OfficeParser.parseOffice(newDocxPath, {
    includeBreaks: true
  });
  await fs.writeFile(
    path.join(input.options.outDir, 'ast.json'),
    JSON.stringify(ast, null, 2)
  );

  const headings = [];

  const traverser = new OfficeTraverser(ast);
  for (const n of traverser.traverse()) {
    if (
      n.type !== 'paragraph' ||
      // @ts-expect-error
      n.metadata?.style !== 'berschriftDoku' ||
      !n.text
    )
      continue;

    // we found a heading
    const matches = HEADING_REGEX.exec(n.text ?? '');

    let headingText: string;
    if (matches !== null) {
      const [, number, text] = matches;
      headingText = `${number} ${text}`;
    } else {
      headingText = n.text;
    }

    headings.push({
      text: headingText,
      pageOffset: traverser.currentPage
    });
  }

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

  return { pages, headings };
};
