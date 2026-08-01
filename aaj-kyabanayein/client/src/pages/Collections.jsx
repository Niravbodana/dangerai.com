import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCollection, fetchCollections } from "../api";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  copyCuratedShareLink,
  filterCollectionRecipes,
  filterCollections,
  sortCollectionRecipes,
  sortCollections,
} from "../lib/collectionUtils";
import { track } from "../lib/analytics";
import usePageSeo from "../hooks/usePageSeo";
import { breadcrumbSchema } from "../lib/seo";

const COLLECTION_FILTERS = [
  { id: "all", label: "All" },
  { id: "quick", label: "Quick" },
  { id: "festival", label: "Festival" },
  { id: "budget", label: "Budget" },
  { id: "healthy", label: "Healthy" },
];

export default function Collections() {
  const { id } = useParams();
  const [collections, setCollections] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name-asc");
  const [filterBy, setFilterBy] = useState("all");
  const [recipeSort, setRecipeSort] = useState("name-asc");
  const [recipeFilter, setRecipeFilter] = useState("all");
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    setLoading(true);
    if (id) {
      fetchCollection(id)
        .then((data) => {
          setDetail(data);
          track("collection_open", { id });
        })
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    } else {
      fetchCollections()
        .then((data) => setCollections(data.collections || []))
        .finally(() => setLoading(false));
      setDetail(null);
    }
  }, [id]);

  const pageSeo = useMemo(() => {
    if (!id || !detail?.collection) return null;
    const c = detail.collection;
    return {
      seo: {
        title: `${c.name} — Recipe Collection | Rasoira`,
        description: c.description || `${c.nameHi || c.name} recipes on Rasoira.`,
        path: `/collections/${id}`,
      },
      jsonLd: [
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Collections", path: "/collections" },
          { name: c.name, path: `/collections/${id}` },
        ]),
      ],
    };
  }, [id, detail]);

  usePageSeo(pageSeo);

  const visibleCollections = useMemo(
    () => sortCollections(filterCollections(collections, filterBy), sortBy),
    [collections, filterBy, sortBy],
  );

  const visibleRecipes = useMemo(() => {
    if (!detail?.recipes) return [];
    return sortCollectionRecipes(filterCollectionRecipes(detail.recipes, recipeFilter), recipeSort);
  }, [detail, recipeFilter, recipeSort]);

  const handleShare = async () => {
    if (!id) return;
    await copyCuratedShareLink(id);
    setShareNote("Collection link copied.");
    setTimeout(() => setShareNote(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (id && detail) {
    const c = detail.collection;
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/collections" className="text-sm text-[var(--accent-soft)]">← All collections</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-4xl">{c.emoji}</span>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-primary)]">{c.name}</h1>
            <p className="mt-1 text-[var(--text-secondary)]">{c.nameHi}</p>
            <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">{c.description}</p>
          </div>
          <button type="button" onClick={handleShare} className="premium-btn-outline px-4 py-2 text-xs">
            Share collection
          </button>
        </div>
        {shareNote && <p className="mt-3 text-xs text-[var(--accent-soft)]">{shareNote}</p>}

        {detail.recipes?.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <select
              value={recipeSort}
              onChange={(e) => setRecipeSort(e.target.value)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="time-asc">Cook time ↑</option>
              <option value="time-desc">Cook time ↓</option>
            </select>
            <div className="flex flex-wrap gap-2">
              {["all", "veg", "non-veg"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRecipeFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                    recipeFilter === f ? "bg-white/15 text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-white/8"
                  }`}
                >
                  {f === "all" ? "All" : f.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
        {visibleRecipes.length === 0 && (
          <p className="mt-8 text-center text-[var(--text-secondary)]">
            {detail.recipes?.length ? "No recipes match this filter." : "No recipes in this collection yet."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-center font-display text-3xl text-[var(--text-primary)]">Collections</h1>
      <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
        Festival, budget, regional & healthy — curated like a magazine
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)]"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
        <div className="flex flex-wrap justify-center gap-2">
          {COLLECTION_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterBy(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filterBy === f.id ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:bg-white/8"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCollections.map((c) => (
          <Link
            key={c.id}
            to={`/collections/${c.id}`}
            className="recipe-card group p-6 transition hover:border-[var(--accent)]/30"
          >
            <span className="text-3xl">{c.emoji}</span>
            <h2 className="mt-3 font-display text-xl text-[var(--text-primary)] group-hover:text-[var(--accent-soft)]">
              {c.name}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{c.nameHi}</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{c.description}</p>
          </Link>
        ))}
      </div>
      {visibleCollections.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">No collections match this filter.</p>
      )}
    </div>
  );
}
