import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSavedMeals, fetchCustomMeals, removeSavedMeal } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getGuestId } from "../lib/guest";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function MyMeals() {
  const { lang } = useLanguage();
  const [saved, setSaved] = useState([]);
  const [custom, setCustom] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const guestId = getGuestId();
    Promise.all([fetchSavedMeals(guestId), fetchCustomMeals(guestId)])
      .then(([s, c]) => {
        setSaved(s.meals || []);
        setCustom(c.meals || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (mealId) => {
    await removeSavedMeal(mealId, getGuestId());
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">
          {lang === "hi" ? "Mere Meals" : "My Meals"}
        </h1>
        <Link to="/add-meal" className="premium-btn px-4 py-2 text-sm">
          {lang === "hi" ? "+ Meal Add" : "+ Add Meal"}
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          {lang === "hi" ? "Plan mein add kiye" : "Added to plan"}
        </h2>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {lang === "hi" ? "Abhi koi meal save nahi. Recipe pe jaake 'Add to Plan' dabao." : "No meals saved yet. Open a recipe and tap 'Add to Plan'."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {saved.map((m) => (
              <li key={m.id} className="glass flex items-center justify-between rounded-xl p-4">
                <div>
                  <Link to={`/recipe/${m.recipeId}`} className="font-medium text-[var(--text-primary)] hover:underline">
                    {m.recipeName}
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)]">{m.date} · {m.mealType}</p>
                </div>
                <button type="button" onClick={() => handleRemove(m.id)} className="text-xs text-red-400 hover:underline">
                  {lang === "hi" ? "Hatao" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          {lang === "hi" ? "Meri recipes" : "My recipes"}
        </h2>
        {custom.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            <Link to="/add-meal" className="text-[var(--accent-soft)] hover:underline">
              {lang === "hi" ? "Apni pehli recipe add karo" : "Add your first custom recipe"}
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {custom.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
