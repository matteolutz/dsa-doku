import { S3 } from '@aws-sdk/client-s3';

export type S3Config = {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint: string;
  region: string;
};

export const getS3Client = (config: S3Config): S3 => {
  const client = new S3(config);

  return client;
};
