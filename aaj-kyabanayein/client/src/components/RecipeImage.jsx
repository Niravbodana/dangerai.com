import { useState } from "react";

const FALLBACK =
  "https://images.unsplash.com/photo-1585937421612-70a008296fbe?w=600&h=450&fit=crop&q=80";

const FALLBACKS = [
  FALLBACK,
  "https://images.unsplash.com/photo-1563379091339-03246963d96a?w=600&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1546833998-877b37c2b5cd?w=600&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=450&fit=crop&q=80",
];

function pickFallback(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % FALLBACKS.length;
  return FALLBACKS[h];
}

export default function RecipeImage({ src, alt, className = "", recipeId = "" }) {
  const [url, setUrl] = useState(src || pickFallback(recipeId));
  const [attempt, setAttempt] = useState(0);

  const onError = () => {
    if (attempt < FALLBACKS.length) {
      setUrl(FALLBACKS[(attempt + 1) % FALLBACKS.length]);
      setAttempt((a) => a + 1);
    } else {
      setUrl(FALLBACK);
    }
  };

  return (
    <img
      src={url || pickFallback(recipeId)}
      alt={alt || "Recipe"}
      className={className}
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  );
}

export { FALLBACK, pickFallback };
