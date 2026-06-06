import { procedure, router } from '..';
import { academyRouter } from './academy';
import { authRouter } from './auth';
import { courseRouter } from './course';
import { docRouter } from './doc';
import { journalRouter } from './journal';
import { userRouter } from './user';

export const appRouter = router({
  health: procedure.query(() => {
    return { status: 'ok' };
  }),
  auth: authRouter,
  user: userRouter,
  academy: academyRouter,
  course: courseRouter,
  doc: docRouter,
  journal: journalRouter
});

export type AppRouter = typeof appRouter;
