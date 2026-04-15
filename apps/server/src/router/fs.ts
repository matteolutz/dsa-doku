import { FileSystemService, verifyDocumentUploadNonce } from '@repo/trpc';
import express from 'express';
import multer from 'multer';
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
