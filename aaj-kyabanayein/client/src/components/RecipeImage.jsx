import { useState } from "react";

const PLACEHOLDER = "/api/recipes/image/_default";

export default function RecipeImage({ src, alt, className = "", recipeId = "", eager = false }) {
  const [failed, setFailed] = useState(false);
  const apiUrl = recipeId ? `/api/recipes/image/${recipeId}` : PLACEHOLDER;
  const url = failed ? PLACEHOLDER : (src || apiUrl);

  return (
    <img
      src={url}
      alt={alt || "Recipe"}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "low"}
      onError={() => setFailed(true)}
    />
  );
}

export { PLACEHOLDER as FALLBACK };
