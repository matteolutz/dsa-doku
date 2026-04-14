import {
  hasPermission,
  ReadWriteScope,
  SafeUser,
  UserRole
} from '@repo/db/types';
import { fmError } from '../error';
import { prisma } from '@repo/db';

export const ensureAccessToAcademy = async (
  user: SafeUser,
  academyId: number,
  scope: ReadWriteScope = 'read'
) => {
  if (
    hasPermission(
      user,
      scope === 'read' ? 'READ_ALL_ACADEMIES' : 'WRITE_ALL_ACADEMIES'
    )
  )
    return;

  if (
    hasPermission(
      user,
      scope === 'read'
        ? 'READ_PARTICIPANT_ACADEMIES'
        : 'WRITE_PARTICIPANT_ACADEMIES'
    )
  ) {
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

    if (count > 0) return;
  }

  throw fmError({
    type: 'unauthorized',
    reason: 'insufficient-permissions'
  }).toTRPCError();
};
