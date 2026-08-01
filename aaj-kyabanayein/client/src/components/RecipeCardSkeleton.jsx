export default function RecipeCardSkeleton() {
  return (
    <div className="recipe-card overflow-hidden" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/8" />
        <div className="flex justify-between pt-1">
          <div className="h-3 w-16 animate-pulse rounded bg-white/8" />
          <div className="h-3 w-12 animate-pulse rounded bg-white/8" />
        </div>
      </div>
    </div>
  );
}
