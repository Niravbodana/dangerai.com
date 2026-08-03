import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTrendingRecipes } from "../api";
import RecipeImage from "./RecipeImage";

const FALLBACK_GALLERY = [
  { id: "gallery-thali", name: "Ghar ka Thali", nameHi: "Ghar ka Thali", thumbUrl: "/home/gallery-thali.png", cuisine: "Comfort food" },
  { id: "gallery-dosa", name: "Masala Dosa", nameHi: "Masala Dosa", thumbUrl: "/home/gallery-dosa.png", cuisine: "South Indian" },
  { id: "gallery-biryani", name: "Veg Biryani", nameHi: "Veg Biryani", thumbUrl: "/home/gallery-biryani.png", cuisine: "Special" },
  { id: "gallery-paneer", name: "Paneer Butter Masala", nameHi: "Paneer Butter Masala", thumbUrl: "/home/gallery-paneer.png", cuisine: "Restaurant style" },
  { id: "gallery-poha", name: "Poha & Chai", nameHi: "Poha & Chai", thumbUrl: "/home/gallery-poha.png", cuisine: "Breakfast" },
  { id: "gallery-chole", name: "Chole Bhature", nameHi: "Chole Bhature", thumbUrl: "/home/gallery-chole.png", cuisine: "Weekend treat" },
];

function getImageSrc(recipe) {
  if (recipe.thumbUrl && !/dummyjson\.com/i.test(recipe.thumbUrl)) return recipe.thumbUrl;
  return recipe.cdnImageUrl || recipe.imageUrl || recipe.thumbUrl;
}

function isFallbackItem(recipe) {
  return String(recipe.id).startsWith("gallery-");
}

function useMarquee(trackRef, itemCount) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track || itemCount < 2) return undefined;

    let offset = 0;
    let paused = false;
    let rafId = 0;
    let lastTs = 0;
    const speed = 42; // px per second — smooth on iPhone

    const pause = () => { paused = true; };
    const resume = () => { paused = false; };

    const tick = (ts) => {
      if (!lastTs) lastTs = ts;
      const delta = Math.min(ts - lastTs, 32);
      lastTs = ts;

      if (!paused) {
        offset += (speed * delta) / 1000;
        const loopWidth = track.scrollWidth / 2;
        if (loopWidth > 0 && offset >= loopWidth) offset -= loopWidth;
        track.style.transform = `translate3d(-${offset}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resume);
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("touchend", resume);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
      track.style.transform = "";
    };
  }, [trackRef, itemCount]);
}

export default function HomeTrendingGallery() {
  const trackRef = useRef(null);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchTrendingRecipes(12)
      .then((data) => setRecipes(data.recipes || []))
      .catch(() => setRecipes([]));
  }, []);

  const marqueeItems = useMemo(
    () => [...FALLBACK_GALLERY, ...FALLBACK_GALLERY],
    [],
  );

  const gridItems = recipes.length >= 6 ? recipes.slice(0, 6) : FALLBACK_GALLERY;

  useMarquee(trackRef, marqueeItems.length);

  return (
    <section className="home-section border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4">
        <p className="home-eyebrow">Ghar ka swad</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              Har region, har mood — ek hi app
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Dosa se lekar biryani, poha se chole bhature — jo mann kare woh banao, photos dekho, pakana shuru karo.
            </p>
          </div>
          <Link to="/recipes?sort=trending" className="shrink-0 text-sm text-[var(--accent-soft)] hover:underline">
            Sab dekho →
          </Link>
        </div>
      </div>

      <div className="home-gallery-scroll mt-10">
        <div ref={trackRef} className="home-gallery-track home-gallery-track--live">
          {marqueeItems.map((recipe, i) => (
            <Link key={`${recipe.id}-${i}`} to="/recipes" className="home-gallery-card group">
              <img
                src={recipe.thumbUrl}
                alt={recipe.nameHi || recipe.name}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="home-gallery-card__overlay">
                <span className="home-gallery-card__tag">{recipe.cuisine}</span>
                <p className="font-semibold text-white">{recipe.nameHi || recipe.name}</p>
                <p className="mt-1 text-xs text-[var(--accent-soft)] opacity-0 transition group-hover:opacity-100 group-active:opacity-100">
                  Recipe dekho →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((recipe) => {
            const to = isFallbackItem(recipe) ? "/recipes" : `/recipe/${recipe.id}`;
            return (
              <Link key={recipe.id} to={to} className="home-gallery-grid-card group">
                <RecipeImage
                  recipeId={recipe.id}
                  src={getImageSrc(recipe)}
                  alt={recipe.nameHi || recipe.name}
                  className="w-full object-cover"
                />
                <div className="home-gallery-grid-card__info">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-soft)]">
                    {recipe.cuisine || "Indian"}
                  </span>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">
                    {recipe.nameHi || recipe.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
