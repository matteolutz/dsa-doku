import type { FC } from 'react';
import * as sanitizeHtml from 'sanitize-html';

export type SanitizeHtmlProps = {
  dirty: string;
  options: sanitizeHtml.IOptions;
};

export const SanitizeHtml: FC<SanitizeHtmlProps> = ({ dirty, options }) => {
  const sanitized = sanitizeHtml.default(dirty, options);

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
