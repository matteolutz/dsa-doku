import type { WpBlock } from '@repo/db/types';
import type { FC } from 'react';

export type JournalPrintMediaProps = {
  media: NonNullable<WpBlock['media']>;
};

export const JournalPrintMediaLink: FC<JournalPrintMediaProps> = ({
  media
}) => {
  return (
    <div className="journal-wp-sans text-[1.5cqw] hidden print:flex items-center justify-between px-[1cqw] py-[0.5cqw]">
      <div>
        <a className="underline text-blue-400" href={media.src} target="_blank">
          Hier
        </a>{' '}
        klicken oder den QR-Code scannen, um die Datei zu öffnen.
      </div>
      <img
        className="h-[2.5cqw]"
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(media.src)}`}
      />
    </div>
  );
};
