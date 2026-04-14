const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Required environment variable ${name} was not set`);
  }

  return value;
};

export const env = {
  JWT_SECRET: requiredEnv('JWT_SECRET'),
  FILE_ROOT: requiredEnv('FILE_ROOT')
};
