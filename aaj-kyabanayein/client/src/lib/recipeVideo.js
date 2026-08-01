/** Parse YouTube video ID from URL or raw id */
export function parseYoutubeId(urlOrId) {
  if (!urlOrId) return null;
  const s = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const match = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=))([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] || null;
}

export function getRecipeVideoId(recipe) {
  if (!recipe) return null;
  return parseYoutubeId(recipe.videoUrl || recipe.videoId);
}

export function getYoutubeEmbedUrl(recipe) {
  const id = getRecipeVideoId(recipe);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
