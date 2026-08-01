import { useEffect, useState } from "react";

const PLACEHOLDER_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#2a231c"/><stop offset="100%" stop-color="#1a1612"/>' +
    '</linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>' +
    '<text x="200" y="155" text-anchor="middle" fill="#8a7a68" font-size="14" font-family="system-ui">Loading photo…</text></svg>'
  );

export default function RecipeImage({ src, alt, className = "", recipeId = "", eager = false, version = 0 }) {
  const [url, setUrl] = useState(PLACEHOLDER_SVG);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setUrl(src || PLACEHOLDER_SVG);
      return;
    }

    let cancelled = false;
    setFailed(false);
    setUrl(PLACEHOLDER_SVG);

    const imageApi = `/api/recipes/image/${recipeId}?wait=${eager ? "1" : "0"}&v=${version}`;

    async function load() {
      try {
        const res = await fetch(imageApi);
        if (!res.ok) {
          if (res.status === 202 && !eager) {
            setTimeout(load, 2000);
            return;
          }
          throw new Error("Image fetch failed");
        }
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [recipeId, eager, version, src]);

  return (
    <img
      src={failed ? PLACEHOLDER_SVG : url}
      alt={alt || "Recipe"}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "low"}
    />
  );
}

export { PLACEHOLDER_SVG as FALLBACK };
