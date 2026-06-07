import { Pause, Play, Volume, VolumeX } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState, type FC } from 'react';
import { JournalPrintMediaLink } from './media';

type JournalAudioPlayerProps = {
  src: string;
  title?: string;
  author?: string;
};

export const JOURNAL_AUDIO_PLAYER_CQW_HEIGHT = 9;

/**
 * Minimal, serif-styled audio player sized in `cqw` units so it scales with
 * the surrounding book container. Drop inside an element with
 * `container-type: inline-size` (e.g. the book page).
 */
export const JournalAudioPlayer: FC<JournalAudioPlayerProps> = ({
  src,
  title,
  author
}) => {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;

    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => setPlaying(false);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);

    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;

    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = ref.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setCurrent(a.currentTime);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div
      style={{
        height: `${JOURNAL_AUDIO_PLAYER_CQW_HEIGHT}cqw`
      }}
      className="journal-wp-block-audio border border-border rounded-md bg-card px-[2cqw] py-[1cqw] flex flex-col gap-[2cqw] w-full"
    >
      <audio ref={ref} src={src} muted={muted} preload="metadata" />
      <div className="flex items-center gap-[2.5cqw]">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="size-[4cqw] flex justify-center items-center cursor-pointer rounded-full bg-foreground text-background"
        >
          <HugeiconsIcon
            icon={playing ? Pause : Play}
            className="size-[2cqw]"
            fill="currentColor"
          />
        </button>

        <div className="grid print:grid-rows-2 grid-rows-3 grid-cols-1 justify-center gap-[0.5cqw] h-full flex-1">
          <div className="flex gap-[2cqw] items-end print:items-center leading-0">
            {title && (
              <span className="font-semibold print:text-[3cqw] tracking-tight">
                {title}
              </span>
            )}
            {author && (
              <span className="text-[1.5cqw] tracking-tight text-muted-foreground">
                {author}
              </span>
            )}
          </div>
          <JournalPrintMediaLink media={{ type: 'audio', src }} />
          <div className="print:hidden relative shrink-0 h-[0.5cqw] bg-[#1a1a1a20] self-center rounded-lg">
            <div
              className="absolute inset-0 bg-black rounded-lg"
              style={{
                width: `${pct}%`
              }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={current}
              step={0.01}
              onChange={seek}
              aria-label="Seek"
              className="absolute inset-0 size-full opacity-0 cursor-pointer m-0"
            />
          </div>
          <div className="print:hidden flex justify-between items-end opacity-70 font-bold tracking-tight mb-0 tabular-nums leading-none">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="print:hidden size-[2cqw] flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
        >
          <HugeiconsIcon
            icon={muted ? VolumeX : Volume}
            className="size-[2cqw]"
          />
        </button>
      </div>
    </div>
  );
};

const fmt = (s: number) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};
