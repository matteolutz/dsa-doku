import { hasPermission, SafeUser, UserRole } from '@repo/db/types';
import { fmError } from '../error';
import { prisma } from '@repo/db';

export const ensureAccessToAcademy = async (
  user: SafeUser,
  academyId: number
) => {
  if (hasPermission(user, 'ACCESS_ALL_ACADEMIES')) return;

  if (hasPermission(user, 'ACCESS_PARTICIPANT_ACADEMIES')) {
    let count = 0;
    switch (user.userRole) {
      case UserRole.KL:
      case UserRole.TN:
        count = await prisma.courseParticipation.count({
          where: {
            course: { academy: { id: academyId } },
            user: { id: user.id }
          }
        });
        break;
      case UserRole.AL:
        count = await prisma.academyAL.count({
          where: {
            academy: { id: academyId },
            user: { id: user.id }
          }
        });
        break;
    }

    if (count === 0) {
      throw fmError({
        type: 'unauthorized',
        reason: 'insufficient-permissions'
      });
    }
  }

  throw fmError({ type: 'unauthorized', reason: 'insufficient-permissions' });
};
