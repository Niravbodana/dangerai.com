import { getYoutubeEmbedUrl } from "../lib/recipeVideo";

export default function RecipeVideoEmbed({ recipe, title }) {
  const embedUrl = getYoutubeEmbedUrl(recipe);
  if (!embedUrl) return null;

  return (
    <div className="recipe-card mt-4 overflow-hidden p-0">
      <div className="p-6 pb-3 sm:p-8 sm:pb-4">
        <h2 className="detail-section-title">Watch &amp; cook</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Short video tutorial</p>
      </div>
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={`${embedUrl}?rel=0`}
          title={title || `${recipe.name} video`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
