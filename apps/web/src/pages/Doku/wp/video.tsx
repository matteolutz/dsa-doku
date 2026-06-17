import {
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState, type FC } from 'react';
import { JournalPrintMediaLink } from './media';

type JournalVideoPlayerProps = {
  src: string;
  poster?: string;
  caption?: string;
};

/**
 * Minimal, serif-styled video player sized in `cqw` units so every control,
 * font and spacing scales with the surrounding book container.
 */
export const JournalVideoPlayer: FC<JournalVideoPlayerProps> = ({
  src,
  poster,
  caption
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, setHover] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const onTime = () => setCurrent(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onEnd = () => setPlaying(false);

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('ended', onEnd);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;

    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrent(v.currentTime);
  };

  const fullscreen = () => {
    wrapRef.current?.requestFullscreen?.();
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <figure className="journal-wp-block-video margin-0 text-[#1a1a1a] flex flex-col gap-[1.4cqw] w-full">
      <div
        ref={wrapRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={toggle}
        className="relative w-full bg-[#1a1a1a] rounded-md overflow-hidden pointer"
      >
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted={muted}
          playsInline
          preload="metadata"
          className="size-full object-cover block"
        />

        {!playing && (
          <div className="print:hidden absolute inset-0 flex justify-center items-center bg-[#1a1a1a30]">
            <div className="w-[8cqw] h-[8cqw] rounded-full bg-[#fafaf7] text-[#1a1a1a] flex items-center justify-center">
              <HugeiconsIcon
                icon={Play}
                style={{
                  width: '4cqw',
                  height: '4cqw',
                  marginLeft: '0.6cqw'
                }}
                fill="currentColor"
              />
            </div>
          </div>
        )}

        <div className="hidden absolute top-0 left-0 size-full print:flex justify-center items-center">
          <div className="p-[2cqw] bg-background rounded-md">
            {caption && <p className="font-bold">{caption}</p>}
            <JournalPrintMediaLink media={{ type: 'video', src }} />
          </div>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          className="print:hidden absolute bottom-0 left-0 right-0 p-[2cqw] flex items-center gap-[2cqw] text-[#fafaf7] bg-gradient-to-t from-[#00000088] to-transparent"
        >
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            style={iconBtn}
          >
            <HugeiconsIcon
              icon={playing ? Pause : Play}
              style={{ width: '2.6cqw', height: '2.6cqw' }}
              fill="currentColor"
            />
          </button>

          <span
            className="text-[2.4cqw] font-bold"
            style={{
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {fmt(current)}
          </span>

          <div className="flex-1 relative h-[0.4cqw] bg-[#ffffff40] rounded-full">
            <div
              className="absolute inset-0 bg-[#fafaf7] rounded-full"
              style={{
                width: `${pct}%`
              }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={current}
              onChange={seek}
              aria-label="Seek"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span
            className="text-[2.4cqw] font-bold"
            style={{
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {fmt(duration)}
          </span>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            style={iconBtn}
          >
            <HugeiconsIcon
              icon={muted ? VolumeX : Volume2}
              style={{ width: '2.6cqw', height: '2.6cqw' }}
            />
          </button>

          <button
            type="button"
            onClick={fullscreen}
            aria-label="Vollbild"
            style={iconBtn}
          >
            <HugeiconsIcon
              icon={Maximize}
              style={{ width: '2.6cqw', height: '2.6cqw' }}
            />
          </button>
        </div>
      </div>

      {caption && (
        <figcaption className="print:hidden text-[1.5cqw] leading-normal overflow-hidden whitespace-nowrap text-ellipsis tracking-tight text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

const iconBtn: React.CSSProperties = {
  width: '4.5cqw',
  height: '4.5cqw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  padding: 0
};

function fmt(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}
