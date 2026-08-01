import { useEffect, useRef, useState } from "react";
import { COOKING_SHORTS } from "../data/cookingShorts";

function ShortCard({ clip }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => {
      if (el.currentTime >= (clip.maxSeconds || 15)) {
        el.currentTime = 0;
        el.play().catch(() => {});
      }
    };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [clip.maxSeconds]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <article className="short-card shrink-0 snap-start">
      <button type="button" onClick={toggle} className="short-card__media group relative block w-full overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={clip.src}
          poster={clip.poster}
          muted
          playsInline
          loop={false}
          preload="metadata"
          autoPlay
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {clip.tag} · 15s
        </span>
        <span className="absolute bottom-3 left-3 right-3 text-left">
          <span className="block text-sm font-semibold text-white">{clip.title}</span>
          <span className="block text-xs text-white/70">{clip.titleHi}</span>
        </span>
        <span className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
          {playing ? "❚❚" : "▶"}
        </span>
      </button>
      <p className="mt-1.5 px-1 text-[10px] text-[var(--text-secondary)]">{clip.credit}</p>
    </article>
  );
}

export default function VideoShorts() {
  return (
    <section className="border-t border-white/[0.06] py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-soft)]">
          Cook shorts
        </p>
        <h2 className="mt-2 text-center font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
          15-second kitchen clips
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[var(--text-secondary)]">
          Free cooking clips — swipe, tap to play/pause. Real kitchen vibes.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto px-4 pb-2">
        <div className="mx-auto flex w-max max-w-none snap-x snap-mandatory gap-3 sm:gap-4">
          {COOKING_SHORTS.map((clip) => (
            <ShortCard key={clip.id} clip={clip} />
          ))}
        </div>
      </div>
    </section>
  );
}
