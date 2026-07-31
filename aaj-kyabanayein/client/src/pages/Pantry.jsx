import { useEffect, useState } from "react";
import { fetchPantryItems, suggestFromPantry } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-[var(--text-primary)] text-[var(--cream-light)]"
          : "glass text-[var(--text-secondary)] hover:bg-white/50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Pantry() {
  const { t } = useLanguage();
  const [pantryItems, setPantryItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [diet, setDiet] = useState("veg");
  const [mealType, setMealType] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchPantryItems().then((data) => setPantryItems(data.items));
  }, []);

  const toggleItem = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSuggest = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await suggestFromPantry({
        ingredients: selected,
        diet,
        mealType: mealType || undefined,
        limit: 24,
      });
      setSuggestions(data.suggestions);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">{t("tryPantry")}</h1>
        <p className="mb-6 text-[var(--text-secondary)]">{t("featPantryDesc")}</p>

        <div className="glass-strong mb-6 rounded-2xl p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Diet</h3>
          <div className="mb-5 flex gap-2">
            <Chip active={diet === "veg"} onClick={() => setDiet("veg")}>{t("veg")}</Chip>
            <Chip active={diet === "non-veg"} onClick={() => setDiet("non-veg")}>{t("nonVeg")}</Chip>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Meal</h3>
          <div className="mb-5 flex flex-wrap gap-2">
            {["", "breakfast", "lunch", "dinner", "snack"].map((type) => (
              <Chip key={type || "all"} active={mealType === type} onClick={() => setMealType(type)}>
                {type || t("allCuisines")}
              </Chip>
            ))}
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {selected.length} selected
          </h3>
          <div className="flex flex-wrap gap-2">
            {pantryItems.map((item) => (
              <Chip
                key={item.key}
                active={selected.includes(item.key)}
                onClick={() => toggleItem(item.key)}
              >
                {item.labelHi} ({item.label})
              </Chip>
            ))}
          </div>

          <button
            onClick={handleSuggest}
            disabled={loading || selected.length === 0}
            className="premium-btn mt-6 w-full py-3 text-sm disabled:opacity-50"
          >
            {loading ? "..." : t("tryPantry")}
          </button>
        </div>

        {searched && (
          <div>
            <h2 className="mb-4 font-display text-xl text-[var(--text-primary)]">
              {suggestions.length} {t("recipesCount")}
            </h2>
            {suggestions.length === 0 ? (
              <p className="text-[var(--text-secondary)]">{t("search")}</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
