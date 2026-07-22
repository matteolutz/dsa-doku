export type DokuDoubleBufferPage =
  | {
      page: number;
      state: 'shown' | 'hidden';
    }
  | { state: 'not-rendered' };

export type DokuDoubleBuffer = {
  a: {
    left: DokuDoubleBufferPage;
    right: DokuDoubleBufferPage;
  };
  b: {
    left: DokuDoubleBufferPage;
    right: DokuDoubleBufferPage;
  };
};

export type DokuDoubleBufferKey = keyof DokuDoubleBuffer;

export const useDokuDoubleBuffer = ({
  currentSheet
}: {
  currentSheet: number;
}): DokuDoubleBuffer => {
  if (currentSheet < 0) throw new Error('currentSheet must be >= 0');

  const currentLeftPage = (currentSheet - 1) * 2 + 1; // range from -1 to infinity
  const currentRightPage = currentLeftPage + 1; // range from 0 to infinity

  if (currentSheet % 2 === 0) {
    // we are on an even sheet, so the shown buffer is 'a'
    return {
      a: {
        left:
          currentLeftPage > 0
            ? { state: 'shown', page: currentLeftPage }
            : { state: 'not-rendered' },
        right: { state: 'shown', page: currentRightPage }
      },
      b: {
        left: { state: 'hidden', page: currentLeftPage + 2 },
        right: { state: 'hidden', page: currentLeftPage + 2 }
      }
    };
  }

  // we are on an odd sheet, so the shown buffer is 'b'
  return {
    a: {
      left: { state: 'hidden', page: currentLeftPage + 2 },
      right: { state: 'hidden', page: currentRightPage + 2 }
    },
    b: {
      left: { state: 'shown', page: currentLeftPage },
      right: { state: 'shown', page: currentRightPage }
    }
  };
};
