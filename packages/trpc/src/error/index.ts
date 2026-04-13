import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server';

export type FMErrorType =
  | {
      type: 'unauthorized';
      reason:
        | 'invalid-auth-header'
        | 'invalid-jwt'
        | 'invalid-token-type'
        | 'invalid-password'
        | 'jwt-expired'
        | 'unknown-user'
        | 'insufficient-permissions'
        | 'invalid-registration-code';
    }
  | {
      type: 'passwords-dont-match';
    };

export class FMError extends Error {
  constructor(public readonly type: FMErrorType) {
    super(`FestivalManagerError - ${JSON.stringify(type)}`);
  }

  toTRPCError(): TRPCError {
    let code: TRPC_ERROR_CODE_KEY;
    switch (this.type.type) {
      case 'unauthorized':
        code = 'UNAUTHORIZED';
        break;
      case 'passwords-dont-match':
        code = 'BAD_REQUEST';
        break;
    }

    throw new TRPCError({
      message: 'A FestivalManager Error occured',
      code,
      cause: this.message
    });
  }
}

export const fmError = (type: FMErrorType): FMError => new FMError(type);
