import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchRecipe, fetchFavorites } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import RecipeGridSkeleton from "../components/RecipeGridSkeleton";
import EmptyState from "../components/EmptyState";
import { QUICK_SEARCH_SUGGESTIONS } from "../lib/searchUtils";
import { getLocalFavorites, setLocalFavorites } from "../lib/guest";
import {
  addRecipeToCollection,
  copyCollectionShareLink,
  createCollection,
  filterRecipes,
  getUserCollection,
  getUserCollections,
  removeRecipeFromCollection,
  renameCollection,
  sortRecipes,
} from "../lib/userCollections";

const SORT_OPTIONS = [
  { id: "recent", label: "Recently saved" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "time-asc", label: "Cook time ↑" },
  { id: "time-desc", label: "Cook time ↓" },
];

export default function Favorites() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCollectionId = searchParams.get("collection");

  const [recipes, setRecipes] = useState([]);
  const [collections, setCollections] = useState(getUserCollections);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [shareNote, setShareNote] = useState("");

  const activeCollection = activeCollectionId ? getUserCollection(activeCollectionId) : null;
  const recipeOrder = activeCollection?.recipeIds || getLocalFavorites();

  const load = async () => {
    const collection = activeCollectionId ? getUserCollection(activeCollectionId) : null;
    let ids = collection ? (collection.recipeIds || []) : getLocalFavorites();

    if (!collection && user) {
      try {
        const guestId = localStorage.getItem("akb-guest-id");
        const data = await fetchFavorites(guestId);
        if (data.ids?.length) {
          ids = data.ids;
          setLocalFavorites(ids);
        }
      } catch {
        /* keep local */
      }
    }

    setCollections(getUserCollections());

    if (ids.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(ids.map((id) => fetchRecipe(id).then((d) => d.recipe).catch(() => null)))
      .then((results) => setRecipes(results.filter(Boolean)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [activeCollectionId, user]);

  const cuisines = useMemo(
    () => [...new Set(recipes.map((r) => r.cuisine).filter(Boolean))].sort(),
    [recipes],
  );

  const visibleRecipes = useMemo(
    () => sortRecipes(filterRecipes(recipes, filterBy), sortBy, recipeOrder),
    [recipes, filterBy, sortBy, recipeOrder],
  );

  const handleCreateFolder = () => {
    const name = window.prompt("Folder name");
    if (!name) return;
    const created = createCollection(name);
    if (!created) {
      window.alert("A folder with that name already exists.");
      return;
    }
    setCollections(getUserCollections());
    setSearchParams({ collection: created.id });
  };

  const handleRenameFolder = () => {
    if (!activeCollection) return;
    const name = window.prompt("Rename folder", activeCollection.name);
    if (!name || name === activeCollection.name) return;
    if (!renameCollection(activeCollection.id, name)) {
      window.alert("Could not rename — name may already exist.");
      return;
    }
    setCollections(getUserCollections());
    load();
  };

  const handleShare = async () => {
    if (!activeCollection) return;
    await copyCollectionShareLink(activeCollection);
    setShareNote("Link copied — share foundation ready for future sync.");
    setTimeout(() => setShareNote(""), 3000);
  };

  const handleAddToFolder = (collectionId, recipeId) => {
    if (!addRecipeToCollection(collectionId, recipeId)) return;
    setCollections(getUserCollections());
  };

  const handleRemoveFromFolder = (recipeId) => {
    if (!activeCollection) return;
    removeRecipeFromCollection(activeCollection.id, recipeId);
    load();
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-[var(--text-primary)]">
              {activeCollection ? activeCollection.name : t("favorites")}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("featFavoritesDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCreateFolder} className="premium-btn-outline px-4 py-2 text-xs">
              + New folder
            </button>
            {activeCollection && (
              <>
                <button type="button" onClick={handleRenameFolder} className="premium-btn-outline px-4 py-2 text-xs">
                  Rename
                </button>
                <button type="button" onClick={handleShare} className="premium-btn-outline px-4 py-2 text-xs">
                  Share
                </button>
              </>
            )}
          </div>
        </div>

        {shareNote && <p className="mt-3 text-xs text-[var(--accent-soft)]">{shareNote}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !activeCollectionId ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:bg-white/8"
            }`}
          >
            All saved
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSearchParams({ collection: c.id })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeCollectionId === c.id ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:bg-white/8"
              }`}
            >
              {c.name} ({c.recipeIds?.length || 0})
            </button>
          ))}
        </div>

        {recipes.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {["all", "veg", "non-veg", ...cuisines].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterBy(f)}
                  className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                    filterBy === f ? "bg-white/15 text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-white/8"
                  }`}
                >
                  {f === "all" ? "All" : f.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <RecipeGridSkeleton count={6} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" />
        ) : visibleRecipes.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="❤️"
              title={activeCollection ? "Folder empty" : t("noFavorites")}
              message={
                activeCollectionId && !activeCollection
                  ? "Folder not found."
                  : activeCollection
                    ? "Add recipes from the heart icon on any recipe card."
                    : "Save recipes you love — try these popular picks:"
              }
              suggestions={!activeCollection ? QUICK_SEARCH_SUGGESTIONS.slice(0, 5) : []}
              onSuggestionClick={(term) => window.location.assign(`/recipes?search=${encodeURIComponent(term)}`)}
              action={
                <Link to="/recipes" className="premium-btn inline-block px-6 py-2.5 text-sm">
                  {t("browseRecipes")}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRecipes.map((recipe) => (
              <div key={recipe.id}>
                <RecipeCard recipe={recipe} onFavoriteChange={load} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!activeCollection && collections.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleAddToFolder(e.target.value, recipe.id);
                        e.target.value = "";
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)]"
                    >
                      <option value="">Add to folder…</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id} disabled={c.recipeIds?.includes(recipe.id)}>
                          {c.name}{c.recipeIds?.includes(recipe.id) ? " ✓" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {activeCollection && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFromFolder(recipe.id)}
                      className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-soft)]"
                    >
                      Remove from folder
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
