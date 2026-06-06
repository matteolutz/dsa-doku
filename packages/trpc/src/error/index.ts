import { DocumentMeta } from '@repo/db/types';
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
    }
  | {
      type: 'resource-not-found';
      resource: 'course' | 'uploaded-doc' | 'doc' | 'doc-fs' | 'academy';
      id: string | number;
    }
  | {
      type: 'document-page-out-of-range';
      page: number;
      availablePages: number;
    }
  | {
      type: 'document-type-mismatch';
      expected: DocumentMeta['type'];
      actual: DocumentMeta['type'];
    }
  | {
      type: 'academy-feature-not-enabled';
      feature: 'aka-journal';
    }
  | {
      type: 'todo';
      feature: string;
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
      message: 'A FestivalManager Error occured',
      code,
      cause: this.message
    });
  }
}

export const fmError = (type: FMErrorType): FMError => new FMError(type);
export const todo = (feature: string) => fmError({ type: 'todo', feature });
