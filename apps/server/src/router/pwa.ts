import express from 'express';

export const pwaRouter: express.Router = express.Router();

pwaRouter.get('/icon-192x192.png', (_, res) => {
  res.redirect(
    'https://gist.github.com/thomkri/bc67a4a25f374f45ff3ed2c5ff2f7d50/raw/27640e3bdb6a02686c2cfd648ec08bd2ea821223/logo192x192.png'
  );
});

pwaRouter.get('/icon-512x512.png', (_, res) => {
  res.redirect('https://ccia.ugr.es/cvg/CG/images/base/2.gif');
});
