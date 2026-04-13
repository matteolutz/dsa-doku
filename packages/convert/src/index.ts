import { MIME_TYPE_MAP } from './mime';
import { ConversionInput, ConversionOutput } from './types';
import path from 'path';
import mime from 'mime';

export * from './types';

export const convertToPdfPages = async (
  input: ConversionInput
): Promise<ConversionOutput> => {
  let mimeType: string;

  if ('mimeType' in input.file) {
    mimeType = input.file.mimeType;
  } else {
    const ext = path.extname(input.file.path);
    const mimeTypeForExt = mime.getType(ext);

    if (!mimeTypeForExt) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    mimeType = mimeTypeForExt;
  }

  const fn = MIME_TYPE_MAP[mimeType];

  if (typeof fn === 'undefined') {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  return fn(input);
};
