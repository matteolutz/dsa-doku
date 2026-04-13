import { procedure, router } from '..';
import { convertToPdfPages } from '@repo/convert';

export const docRouter = router({
  create: procedure.mutation(async () => {
    const tempDir = '/Users/matteolutz/Desktop/temp';
    const outDir = '/Users/matteolutz/Desktop/out';
    const testFile =
      '/Users/matteolutz/Desktop/VBT Schwäbisch Gmünd Ablauf.pdf';

    try {
      const result = await convertToPdfPages({
        file: { path: testFile },
        preferredStartingPageNumber: 67,
        options: { tempDir, outDir }
      });
      console.log('result:', result);
    } catch (e) {
      console.log(e);
    }
  })
});
