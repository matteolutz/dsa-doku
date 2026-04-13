export type ConversionInputFile =
  | {
      path: string;
    }
  | {
      buffer: Buffer;
      mimeType: string;
    };

export type ConversionInput = {
  file: ConversionInputFile;
  preferredStartingPageNumber: number;

  options: {
    tempDir: string;
    outDir: string;
  };
};

export type ConversionOutput = {
  pages: { path: string }[];
};

export type ConversionFn = (
  input: ConversionInput
) => Promise<ConversionOutput>;
