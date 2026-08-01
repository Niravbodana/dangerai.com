import RecipeCardSkeleton from "./RecipeCardSkeleton";

export default function RecipeGridSkeleton({ count = 6, className = "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={className} role="status" aria-label="Loading recipes">
      {[...Array(count)].map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}
