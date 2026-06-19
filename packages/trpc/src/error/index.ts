import { FMErrorType } from '@repo/db/types';
import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server';

export class FMError extends Error {
  public readonly isFmError = true;

  constructor(public readonly type: FMErrorType) {
    super(`${JSON.stringify(type)}`);
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
      case 'resource-not-found':
        code = 'NOT_FOUND';
        break;
      case 'document-type-mismatch':
        code = 'BAD_REQUEST';
        break;
      case 'document-page-out-of-range':
        code = 'BAD_REQUEST';
        break;
      case 'academy-feature-not-enabled':
        code = 'BAD_REQUEST';
        break;
      case 'todo':
        code = 'INTERNAL_SERVER_ERROR';
        break;
    }

    throw new TRPCError({
      message: `${this.type.type}`,
      code,
      cause: this
    });
  }
}

export const fmError = (type: FMErrorType): FMError => new FMError(type);
export const todo = (feature: string) => fmError({ type: 'todo', feature });
