import {
  FileSystemService,
  verifyDocumentUploadNonce,
  verifyReadDocumentNonce
} from '@repo/trpc';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

export const fsRouter: express.Router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_, file, cb) => {
      try {
        const docId = uuid();
        const fs = await FileSystemService.instance.makeDocumentFs(docId);

        // @ts-ignore
        file.docId = docId;

        cb(null, fs.rootDir);
      } catch (err) {
        cb(err as Error, '');
      }
    },
    filename: (_, file, cb) => {
      // fix filename encoding
      // https://github.com/expressjs/multer/issues/1104
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf-8'
      );

      cb(null, file.originalname);
    }
  }),
  fileFilter: (req, _, cb) => {
    const nonce = req.query['nonce'];
    if (typeof nonce !== 'string') return cb(new Error('Nonce is required'));

    const verificationResult = verifyDocumentUploadNonce(nonce);
    if (verificationResult.status === 'error')
      return cb(new Error('Invalid nonce'));

    // accept the file
    cb(null, true);
  }
});

fsRouter.post('/doc', upload.single('file'), (req, res) => {
  const file = req.file!;

  // @ts-ignore
  const docId: string = file.docId!;

  const fileName = file.filename;

  res.json({ docId, originalFileName: fileName });
});

fsRouter.get('/doc', async (req, res) => {
  const nonce = req.query['nonce'];
  if (typeof nonce !== 'string')
    return res.status(400).json({ error: 'Nonce is required' });

  const verificationResult = verifyReadDocumentNonce(nonce);
  if (verificationResult.status === 'error')
    return res.status(400).json({ error: 'Invalid nonce' });

  const docId = verificationResult.data.docId;

  const requestedPage = req.query['page'];
  if (typeof requestedPage !== 'string')
    return res.status(400).json({ error: 'Page is required' });

  const pageIndex = parseInt(requestedPage, 10);
  if (isNaN(pageIndex) || pageIndex < 0)
    return res.status(400).json({ error: 'Invalid page' });

  if (pageIndex >= verificationResult.data.docPages.length)
    return res.status(400).json({ error: 'Invalid page' });

  const docFs = await FileSystemService.instance.checkDocumentFs(docId);
  if (!docFs) return res.status(404).json({ error: 'Document not found' });

  const pagePath = path.join(
    docFs.outDir,
    verificationResult.data.docPages[pageIndex]!
  );

  res.sendFile(pagePath);
});
