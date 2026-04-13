import { procedure, router } from '..';
import { authRouter } from './auth';
import { docRouter } from './doc';
import { userRouter } from './user';

export const appRouter = router({
  health: procedure.query(() => {
    return { status: 'ok' };
  }),
  auth: authRouter,
  user: userRouter,
  doc: docRouter
});

export type AppRouter = typeof appRouter;
