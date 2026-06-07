import type { FC } from 'react';
import sanitize from 'sanitize-html';

export type SanitizeHtmlProps = {
  dirty: string;
  options: sanitize.IOptions;
};

export const SanitizeHtml: FC<SanitizeHtmlProps> = ({ dirty, options }) => {
  const sanitized = sanitize(dirty, options);

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
