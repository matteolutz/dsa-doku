import {
  Course,
  hasPermission,
  ReadWriteScope,
  SafeUser
} from '@repo/db/types';
import { ensureAccessToAcademy } from './academy';
import { fmError } from '../error';
import { prisma } from '@repo/db';

export const ensureAccessToCourse = async (
  user: SafeUser,
  course: Course | number,
  scope: ReadWriteScope = 'read'
) => {
  if (typeof course === 'number') {
    const dbCourse = await prisma.course.findUnique({
      where: { id: course }
    });
    if (!dbCourse)
      throw fmError({
        type: 'resource-not-found',
        resource: 'course',
        id: course
      }).toTRPCError();

    course = dbCourse;
  }

  if (
    hasPermission(
      user,
      scope === 'read'
        ? 'READ_ALL_ACADEMY_WIDE_COURSES'
        : 'WRITE_ALL_ACADEMY_WIDE_COURSES'
    ) ||
    (course.allowReading && scope === 'read')
  ) {
    await ensureAccessToAcademy(user, course.academyId, scope);
    return;
  }

  if (
    hasPermission(
      user,
      scope === 'read'
        ? 'READ_PARTICIPANT_COURSES'
        : 'WRITE_PARTICIPANT_COURSES'
    )
  ) {
    const participation = await prisma.courseParticipation.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: user.id
        }
      }
    });

    if (participation !== null) return;
  }

  throw fmError({
    type: 'unauthorized',
    reason: 'insufficient-permissions'
  }).toTRPCError();
};
