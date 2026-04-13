import { procedure, router } from '..';
import { requireUser } from '../utils/auth';

export const userRouter = router({
  me: procedure.query(({ ctx }) => {
    const user = requireUser(ctx);

    return { user };
  })
});
