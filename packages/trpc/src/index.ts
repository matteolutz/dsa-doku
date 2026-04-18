import { initTRPC } from '@trpc/server';
import SuperJSON from 'superjson';
import { Context } from './context';

export const t = initTRPC.context<Context>().create({
  transformer: SuperJSON
});

export const router = t.router;
export const procedure = t.procedure;

export { trpcExpress } from './express';
export { type AppRouter } from './routers';

export { FileSystemService } from './services/fs';

export { env } from './env';
export {
  verifyDocumentUploadNonce,
  verifyReadDocumentNonce
} from './utils/nonce';
