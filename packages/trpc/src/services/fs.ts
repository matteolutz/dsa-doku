import path from 'path';
import { env } from '../env';
import fs from 'fs/promises';

export type DocumentFs = {
  rootDir: string;
  tempDir: string;
  outDir: string;
};

export class FileSystemService {
  private static _instance: FileSystemService | null = null;

  private constructor() {}

  private getDir(dir: string): string {
    return path.join(env.FILE_ROOT, dir);
  }

  async makeDocumentFs(documentId: string): Promise<DocumentFs> {
    const rootDir = this.getDir(documentId);
    const tempDir = this.getDir(`${documentId}/temp`);
    const outDir = this.getDir(`${documentId}/out`);

    await fs.mkdir(rootDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(outDir, { recursive: true });

    return {
      rootDir,
      tempDir,
      outDir
    };
  }

  async cleanDocumentFsTemp(documentId: string): Promise<void> {
    const tempDir = this.getDir(`${documentId}/temp`);

    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  }

  static get instance() {
    if (!FileSystemService._instance) {
      FileSystemService._instance = new FileSystemService();
    }

    return FileSystemService._instance;
  }
}
