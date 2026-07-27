import 'dotenv/config';

import express from 'express';

import { trpcExpress } from '@repo/trpc';

import cors from 'cors';
import { fsRouter } from './router/fs';

const app = express();

app.use(
  cors({
    origin: '*'
  })
);

app.use('/health', (_, res) => {
  return res.json({ status: 'OK' });
});

app.use('/fs', fsRouter);
app.use('/trpc', trpcExpress);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
