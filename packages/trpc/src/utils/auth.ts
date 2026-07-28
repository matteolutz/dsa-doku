import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../env';
import { FMError, fmError } from '../error';
import { prisma } from '@repo/db';
import type { Request } from 'express';
import { SafeUser } from '@repo/db/types';
import { Context } from '../context';
import { hasPermission, UserPermissionFlags } from '@repo/permissions';

export type JwtTokenType = 'access' | 'refresh';
type FMJwtPayload = JwtPayload & { tokenType: JwtTokenType };

export const getUserFromToken = async (
  token: string
): Promise<{ user: SafeUser; tokenType: JwtTokenType }> => {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err instanceof TokenExpiredError)
      throw fmError({ type: 'unauthorized', reason: 'jwt-expired' });

    throw err;
  }

  if (typeof payload === 'string') {
    throw fmError({ type: 'unauthorized', reason: 'invalid-jwt' });
  }

  const tokenType = payload.tokenType as JwtTokenType | undefined;
  if (!payload.sub || !tokenType) {
    throw fmError({ type: 'unauthorized', reason: 'invalid-jwt' });
  }

  const userId = parseInt(payload.sub);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw fmError({ type: 'unauthorized', reason: 'unknown-user' });
  }

  return { user, tokenType };
};

export const getUserFromHeaders = async (req: Request) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    throw fmError({ type: 'unauthorized', reason: 'invalid-auth-header' });
  }

  const [tokenType, token] = authHeader.split(' ');
  if (tokenType !== 'Bearer' || !token) {
    throw fmError({ type: 'unauthorized', reason: 'invalid-auth-header' });
  }

  return getUserFromToken(token);
};

export const requireUser = (
  ctx: Context,
  requiredTokenType: JwtTokenType = 'access'
): SafeUser => {
  if (ctx.user.status === 'ok') {
    if (ctx.user.data.tokenType !== requiredTokenType)
      throw fmError({
        type: 'unauthorized',
        reason: 'invalid-token-type'
      }).toTRPCError();

    return ctx.user.data.user;
  }

  if (ctx.user.error instanceof FMError) throw ctx.user.error.toTRPCError();

  throw ctx.user.error;
};

export const assertUserPermissions = (
  user: SafeUser,
  ...permissions: (keyof typeof UserPermissionFlags)[]
) => {
  for (const permission of permissions) {
    if (!hasPermission(user, permission)) {
      throw fmError({
        type: 'unauthorized',
        reason: 'insufficient-permissions'
      }).toTRPCError();
    }
  }
};

export const generateUserTokenPair = (user: SafeUser) => {
  const refreshToken = jwt.sign(
    {
      tokenType: 'refresh'
    } satisfies FMJwtPayload,
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: '' + user.id,
      expiresIn: '30d'
    }
  );

  const accessToken = generateUserAccessToken(user);

  return { accessToken, refreshToken };
};

export const generateUserAccessToken = (user: SafeUser) =>
  jwt.sign(
    {
      tokenType: 'access'
    } satisfies FMJwtPayload,
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: '' + user.id,
      expiresIn: '1d'
    }
  );
