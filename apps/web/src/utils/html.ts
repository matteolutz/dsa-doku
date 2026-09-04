export const htmlToPlainText = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent ?? '';
};

export const awaitImageElement = (
  img: HTMLImageElement,
  options?: { overrideLoadingMode?: 'lazy' | 'eager' }
): Promise<void> =>
  new Promise((resolve) => {
    if (img.complete) {
      resolve();
      return;
    }

    if (options?.overrideLoadingMode) {
      img.loading = options.overrideLoadingMode;
    }

    const finish = () => {
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      resolve();
    };

    img.addEventListener('load', finish);
    img.addEventListener('error', finish);
  });
