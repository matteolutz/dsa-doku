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
  removePageNumbers: boolean;

  options: {
    tempDir: string;
    outDir: string;
  };
};

export type ConversionOutput = {
  pages: { path: string }[];

  /**
   * Heading titles with page offset (0 == first page)
   */
  headings: Record<string, number>;
};

export type ConversionFn = (
  input: ConversionInput
) => Promise<ConversionOutput>;
