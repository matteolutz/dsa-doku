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
  headings: {
    text: string;
    pageOffset: number;
  }[];
};

export type ConversionFnProgress = {
  /**
   * The current progress in the range
   * from 0.0 to 1.0
   */
  progress: number;

  /**
   * The current progress message
   */
  message: string;
};

export type ConversionFnOptions = {
  onProgress?: (progress: ConversionFnProgress) => void;
};

export type ConversionFn = (
  input: ConversionInput,
  options?: ConversionFnOptions
) => Promise<ConversionOutput>;
