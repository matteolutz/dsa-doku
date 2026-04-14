import { FileSystemService } from '@repo/trpc';
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
  })
});

fsRouter.post('/doc', upload.single('file'), (req, res) => {
  const file = req.file!;

  // @ts-ignore
  const docId: string = file.docId!;

  const fileName = file.filename;

  res.json({ docId, originalFileName: fileName });
});
