import { useState } from "react";

const PLACEHOLDER = "/api/recipes/image/_default";

export default function RecipeImage({ src, alt, className = "", recipeId = "" }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? PLACEHOLDER : (src || PLACEHOLDER);

  return (
    <img
      src={url}
      alt={alt || "Recipe"}
      className={className}
      loading="lazy"
      decoding="async"
      fetchPriority={recipeId ? "low" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}

export { PLACEHOLDER as FALLBACK };
