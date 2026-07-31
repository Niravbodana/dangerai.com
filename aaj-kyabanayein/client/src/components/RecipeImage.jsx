import { useState } from "react";

const FALLBACK = "/api/recipes/image/_default";

const FALLBACKS = [FALLBACK];

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
