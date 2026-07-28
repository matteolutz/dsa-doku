import z from 'zod';
import { procedure, router } from '..';
import { requireUser } from '../utils/auth';
import { hasPermission } from '@repo/permissions';
import { fmError } from '../error';

export const courseRouter = router({
  create: procedure
    .input(
      z.object({
        academyId: z.number(),
        title: z.string(),
        subtitle: z.string(),
        courseIdx: z.number()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = requireUser(ctx);
      if (!hasPermission(user, 'WRITE_ALL_ACADEMIES'))
        throw fmError({
          type: 'unauthorized',
          reason: 'insufficient-permissions'
        }).toTRPCError();

      return ctx.prisma.course.create({
        data: {
          academy: { connect: { id: input.academyId } },
          title: input.title,
          subtitle: input.subtitle,
          courseIdx: input.courseIdx
        }
      });
    })
});
