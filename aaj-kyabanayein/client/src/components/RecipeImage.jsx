import { memo, useEffect, useState } from "react";

const PLACEHOLDER_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#2a231c"/><stop offset="100%" stop-color="#1a1612"/>' +
    '</linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>' +
    '<text x="200" y="155" text-anchor="middle" fill="#8a7a68" font-size="13" font-family="system-ui">Photo…</text></svg>'
  );

function isExternal(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

export default memo(function RecipeImage({ src, alt, className = "", recipeId = "", eager = false, version = 0 }) {
  const [url, setUrl] = useState(() => (isExternal(src) ? src : PLACEHOLDER_SVG));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    setFailed(false);

    if (isExternal(src)) {
      setUrl(src);
      return () => { cancelled = true; };
    }

    if (!recipeId) {
      setUrl(src || PLACEHOLDER_SVG);
      return () => { cancelled = true; };
    }

    setUrl(PLACEHOLDER_SVG);
    const imageApi = `/api/recipes/image/${recipeId}?wait=${eager ? "1" : "0"}&v=${version}`;
    let tries = 0;

    async function load() {
      try {
        const res = await fetch(imageApi);
        if (cancelled) return;

        if (res.status === 202) {
          const data = await res.json().catch(() => ({}));
          // Use remote thumb immediately while cache warms
          if (data.thumbUrl && isExternal(data.thumbUrl)) {
            setUrl(data.thumbUrl);
          }
          if (tries < 10) {
            tries += 1;
            setTimeout(load, eager ? 500 : 800);
          }
          return;
        }
        if (!res.ok) throw new Error("fail");
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
      onError={() => setFailed(true)}
    />
  );
});

export { PLACEHOLDER_SVG as FALLBACK };
