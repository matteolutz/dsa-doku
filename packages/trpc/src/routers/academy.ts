import { hasPermission, UserRole } from '@repo/db/types';
import { procedure, router } from '..';
import { requireUser } from '../utils/auth';
import { fmError } from '../error';
import z from 'zod';
import { ensureAccessToAcademy } from '../utils/academy';

export const academyRouter = router({
  getSelectable: procedure.query(async ({ ctx }) => {
    // make sure, we are signed in
    const user = requireUser(ctx);

    if (hasPermission(user, 'READ_ALL_ACADEMIES')) {
      return ctx.prisma.academy.findMany({
        orderBy: [
          {
            year: 'desc'
          },
          {
            yearIdx: 'asc'
          }
        ]
      });
    }

    if (hasPermission(user, 'WRITE_PARTICIPANT_ACADEMIES')) {
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
            },
            orderBy: [
              {
                year: 'desc'
              },
              {
                yearIdx: 'asc'
              }
            ]
          });
        case UserRole.AL:
          return ctx.prisma.academy.findMany({
            where: {
              academyALs: {
                some: {
                  user: { id: user.id }
                }
              }
            },
            orderBy: [
              {
                year: 'desc'
              },
              {
                yearIdx: 'asc'
              }
            ]
          });
      }
    }

    throw fmError({
      type: 'unauthorized',
      reason: 'insufficient-permissions'
    }).toTRPCError();
  }),
  getWithCourses: procedure
    .input(
      z.object({
        academyId: z.int()
      })
    )
    .query(async ({ ctx, input }) => {
      const user = requireUser(ctx);
      await ensureAccessToAcademy(user, input.academyId);

      return ctx.prisma.academy.findUnique({
        where: { id: input.academyId },
        include: {
          courses: {
            orderBy: { courseIdx: 'asc' }
          }
        }
      });
    })
});
