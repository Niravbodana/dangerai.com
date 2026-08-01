import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCollection, fetchCollections } from "../api";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { track } from "../lib/analytics";

export default function Collections() {
  const { id } = useParams();
  const [collections, setCollections] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <div className="mt-4">
          <span className="text-4xl">{c.emoji}</span>
          <h1 className="mt-2 font-display text-3xl text-[var(--text-primary)]">{c.name}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">{c.nameHi}</p>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">{c.description}</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(detail.recipes || []).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
        {(detail.recipes || []).length === 0 && (
          <p className="mt-8 text-center text-[var(--text-secondary)]">No recipes in this collection yet.</p>
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
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
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
    </div>
  );
}
