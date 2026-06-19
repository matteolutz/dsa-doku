import { DocumentMeta } from './types';

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
