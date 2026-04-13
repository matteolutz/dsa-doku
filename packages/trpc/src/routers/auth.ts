import { procedure, router } from '..';
import z from 'zod';
import { fmError } from '../error';
import bcrypt from 'bcrypt';
import {
  generateUserAccessToken,
  generateUserTokenPair,
  requireUser
} from '../utils/auth';

export const authRouter = router({
  register: procedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        password: z.string(),
        confirmPassword: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.password !== input.confirmPassword) {
        throw fmError({ type: 'passwords-dont-match' }).toTRPCError();
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          password: passwordHash,
          email: input.email,
          permissions: 0
        }
      });

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
        where: { email: input.email }
      });

      if (!user) {
        throw fmError({
          type: 'unauthorized',
          reason: 'unknown-user'
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
