import { hasPermission, UserRole } from '@repo/db/types';
import { procedure, router } from '..';
import { requireUser } from '../utils/auth';
import { fmError } from '../error';

export const academyRouter = router({
  getSelectable: procedure.query(async ({ ctx }) => {
    // make sure, we are signed in
    const user = requireUser(ctx);

    if (hasPermission(user, 'ACCESS_ALL_ACADEMIES')) {
      return ctx.prisma.academy.findMany();
    }

    if (hasPermission(user, 'ACCESS_PARTICIPANT_ACADEMIES')) {
      switch (user.userRole) {
        case UserRole.TN:
        case UserRole.KL:
          return ctx.prisma.academy.findMany({
            where: {
              courses: {
                some: {
                  courseParticipations: { some: { user: { id: user.id } } }
                }
              }
            }
          });
        case UserRole.AL:
          return ctx.prisma.academy.findMany({
            where: {
              academyALs: {
                some: {
                  user: { id: user.id }
                }
              }
            }
          });
      }
    }

    throw fmError({
      type: 'unauthorized',
      reason: 'insufficient-permissions'
    }).toTRPCError();
  })
});
