import { useEffect, useState } from "react";
import { fetchPantryItems, suggestFromPantry } from "../api";
import Navbar from "../components/Navbar";
import RecipeCard from "../components/RecipeCard";

export default function Pantry() {
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
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">🏠 Ghar Me Kya Pada Hai?</h1>
        <p className="mb-6 text-gray-600">
          Jo samaan ghar me hai select karo — hum batayenge kya bana sakte ho
        </p>

        <div className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-800">Diet</h3>
          <div className="mb-4 flex gap-2">
            {[
              { value: "veg", label: "🥬 Veg" },
              { value: "non-veg", label: "🍗 Non-Veg" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDiet(opt.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  diet === opt.value ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <h3 className="mb-3 font-semibold text-gray-800">Meal (optional)</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {["", "breakfast", "lunch", "dinner", "snack"].map((type) => (
              <button
                key={type || "all"}
                onClick={() => setMealType(type)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                  mealType === type ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {type || "Sab"}
              </button>
            ))}
          </div>

          <h3 className="mb-3 font-semibold text-gray-800">
            Ghar me yeh hai ({selected.length} selected)
          </h3>
          <div className="flex flex-wrap gap-2">
            {pantryItems.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleItem(item.key)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  selected.includes(item.key)
                    ? "bg-orange-500 text-white"
                    : "border border-orange-200 text-orange-700 hover:bg-orange-50"
                }`}
              >
                {item.labelHi} ({item.label})
              </button>
            ))}
          </div>

          <button
            onClick={handleSuggest}
            disabled={loading || selected.length === 0}
            className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Dhoondh rahe hain..." : "🔍 Batao Kya Banayein!"}
          </button>
        </div>

        {searched && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {suggestions.length} recipes mil gayi
            </h2>
            {suggestions.length === 0 ? (
              <p className="text-gray-500">
                Is combination se kuch nahi mila. Aur items select karo ya diet change karo.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} matchPercent={recipe.matchPercent} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
