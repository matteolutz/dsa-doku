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

app.use('/trpc', trpcExpress);
app.use('/fs', fsRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
