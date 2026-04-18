import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { error, ok, Result } from './result';

export type DocumentUploadNoncePayload = JwtPayload;

export const generateDocumentUploadNonce = (
  userId: number,
  payload: DocumentUploadNoncePayload = {}
) => {
  return jwt.sign(payload, env.NONCE_SECRET, {
    expiresIn: '5min',
    algorithm: 'HS256',
    subject: '' + userId
  });
};

export const verifyDocumentUploadNonce = (
  nonce: string
): Result<DocumentUploadNoncePayload, unknown> => {
  try {
    const payload = jwt.verify(nonce, env.NONCE_SECRET, {
      algorithms: ['HS256']
    }) as JwtPayload;
    return ok(payload);
  } catch (e) {
    return error(e);
  }
};

export type DocumentReadNoncePayload = JwtPayload & {
  docId: string;
  docPages: string[];
};

export const generateReadDocumentNonce = (
  userId: number,
  payload: DocumentReadNoncePayload
) =>
  jwt.sign(payload, env.NONCE_SECRET, {
    expiresIn: '5min',
    algorithm: 'HS256',
    subject: '' + userId
  });

export const verifyReadDocumentNonce = (
  nonce: string
): Result<DocumentReadNoncePayload, unknown> => {
  try {
    const payload = jwt.verify(nonce, env.NONCE_SECRET, {
      algorithms: ['HS256']
    }) as DocumentReadNoncePayload;
    return ok(payload);
  } catch (e) {
    return error(e);
  }
};
