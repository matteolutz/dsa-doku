import { prisma } from '@repo/db';
import { SafeUser } from '@repo/db/types';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { getUserFromHeaders, JwtTokenType, requireUser } from './utils/auth';
import { error, ok, Result } from './utils/result';

export type CtxUserResult = Result<
  { user: SafeUser; tokenType: JwtTokenType },
  unknown
>;

/**
 * Creates the context for tRPC by extracting the request and response objects from the Express context options.
 */
export const createContext = async ({
  req,
  res
}: CreateExpressContextOptions): Promise<{
  prisma: typeof prisma;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];

  user: CtxUserResult;
}> => {
  const user = await getUserFromHeaders(req).then(ok).catch(error);

  return {
    prisma,
    req,
    res,
    user
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
