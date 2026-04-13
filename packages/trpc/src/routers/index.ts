import { procedure, router } from '..';
import { authRouter } from './auth';
import { userRouter } from './user';

export const appRouter = router({
  health: procedure.query(() => {
    return { status: 'ok' };
  }),
  auth: authRouter,
  user: userRouter
});

export type AppRouter = typeof appRouter;
