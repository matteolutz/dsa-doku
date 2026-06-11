import { S3Config } from './s3';

export const tryEnv = (name: string) => {
  const value = process.env[name];
  if (typeof value === 'undefined' || value === '') {
    return null;
  }

  return value;
};

const requiredEnv = (name: string) => {
  const value = tryEnv(name);
  if (value === null) {
    throw new Error(`Required environment variable ${name} was not set`);
  }

  return value;
};

export type FileSystem =
  | {
      type: 'local';
      root: string;
    }
  | {
      type: 's3';
      config: S3Config;
    };

const getFs = (): FileSystem => {
  const fileRoot = tryEnv('FILE_ROOT');
  if (fileRoot !== null) {
    return { type: 'local', root: fileRoot };
  }

  return {
    type: 's3',
    config: {
      endpoint: requiredEnv('S3_ENDPOINT'),
      credentials: {
        accessKeyId: requiredEnv('S3_ACCESS_KEY_ID'),
        secretAccessKey: requiredEnv('S3_SECRET_ACCESS_KEY')
      },
      region: requiredEnv('S3_REGION')
    }
  };
};

export const env = {
  JWT_SECRET: requiredEnv('JWT_SECRET'),
  NONCE_SECRET: requiredEnv('NONCE_SECRET'),
  FILE_ROOT: tryEnv('FILE_ROOT') ?? '',

  FILE_SYSTEM: getFs()
};
