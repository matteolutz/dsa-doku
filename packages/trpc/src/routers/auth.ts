import { procedure, router } from '..';
import z from 'zod';
import { fmError } from '../error';
import bcrypt from 'bcrypt';
import {
  generateUserAccessToken,
  generateUserTokenPair,
  requireUser
} from '../utils/auth';
import { prisma } from '@repo/db';

export const authRouter = router({
  register: procedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        password: z.string(),
        confirmPassword: z.string(),
        registrationCode: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const registrationCode = await prisma.registrationCode.findUnique({
        where: {
          code: input.registrationCode,
          OR: [{ usedById: null }, { allowReuse: true }]
        }
      });

      if (!registrationCode) {
        throw fmError({
          type: 'unauthorized',
          reason: 'invalid-registration-code'
        }).toTRPCError();
      }

      if (input.password !== input.confirmPassword) {
        throw fmError({ type: 'passwords-dont-match' }).toTRPCError();
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          password: passwordHash,
          userRole: registrationCode.userRole,
          email: input.email,
          permissions: 0
        }
      });

      // add the user to the course if the registration code has a courseId
      if (registrationCode.courseId) {
        await ctx.prisma.course.update({
          where: { id: registrationCode.courseId },
          data: {
            courseParticipations: {
              create: { user: { connect: { id: user.id } } }
            }
          }
        });
      }

      if (!registrationCode.allowReuse) {
        // if the registration code does not allow reuse
        // update the usedBy field to prevent reuse
        await ctx.prisma.registrationCode.update({
          where: { code: registrationCode.code },
          data: {
            usedBy: { connect: { id: user.id } }
          }
        });
      }

      return generateUserTokenPair(user);
    }),
  login: procedure
    .input(
      z.object({
        email: z.string(),
        password: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        omit: { password: false }
      });

      if (!user) {
        throw fmError({
          type: 'unauthorized',
          reason: 'unknown-user'
        }).toTRPCError();
      }

      const isPasswordValid = await bcrypt.compare(
        input.password,
        user.password
      );

      if (!isPasswordValid) {
        throw fmError({
          type: 'unauthorized',
          reason: 'invalid-password'
        }).toTRPCError();
      }

      return generateUserTokenPair(user);
    }),
  refresh: procedure.mutation(async ({ input, ctx }) => {
    const user = requireUser(ctx, 'refresh');

    const accessToken = generateUserAccessToken(user);
    return { accessToken };
  })
});
