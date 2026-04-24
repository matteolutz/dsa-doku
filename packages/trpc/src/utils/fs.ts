import fs from 'fs/promises';
import path from 'path';

export const searchFileRecursively = async (
  dir: string,
  fileName: string
): Promise<string | null> => {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);

    if (file === fileName) {
      return filePath;
    }

    const fileStat = await fs.stat(filePath);
    if (fileStat.isDirectory()) {
      const result = await searchFileRecursively(filePath, fileName);
      if (result !== null) return result;
    }
  }

  return null;
};
