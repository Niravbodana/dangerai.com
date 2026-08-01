import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { addCustomMeal } from "../api";
import { getGuestId } from "../lib/guest";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function AddMeal() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [cookTime, setCookTime] = useState(30);
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const parseLines = (text) =>
    text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split("—").map((p) => p.trim());
      if (parts.length >= 2) return { name: parts[0], nameHi: parts[0], quantity: parts[1] };
      const m = line.match(/^(.+?)\s+(\d+.*)$/);
      if (m) return { name: m[1], nameHi: m[1], quantity: m[2] };
      return { name: line, nameHi: line, quantity: "as needed" };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const ingredients = parseLines(ingredientsText);
      const steps = stepsText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!name || ingredients.length === 0 || steps.length === 0) {
        setError(lang === "hi" ? "Naam, ingredients aur steps zaroori hain" : "Name, ingredients and steps are required");
        return;
      }
      const data = await addCustomMeal({
        name, nameHi: nameHi || name, mealType, cookTime: Number(cookTime),
        ingredients, steps, stepsHi: steps, guestId: getGuestId(),
      });
      navigate(`/recipe/${data.recipe.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">
        {lang === "hi" ? "Apna Meal Add Karo" : "Add Your Meal"}
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {lang === "hi" ? "Apni family recipe yahan save karo" : "Save your family recipe here"}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="text-sm text-[var(--text-secondary)]">{lang === "hi" ? "Dish ka naam" : "Dish name"}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[var(--text-primary)]" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">{lang === "hi" ? "Hindi naam (optional)" : "Hindi name (optional)"}</label>
          <input value={nameHi} onChange={(e) => setNameHi(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[var(--text-primary)]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)]">Meal type</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[var(--text-primary)]">
              {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)]">{t("min")}</label>
            <input type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)} min={5}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[var(--text-primary)]" />
          </div>
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">
            {lang === "hi" ? "Ingredients (har line: naam — quantity)" : "Ingredients (one per line: name — quantity)"}
          </label>
          <textarea value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} rows={6} required
            placeholder={"Rice — 2 cups\nOnion — 2 medium\nOil — 2 tbsp"}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-primary)]" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">
            {lang === "hi" ? "Cooking steps (har line ek step)" : "Cooking steps (one per line)"}
          </label>
          <textarea value={stepsText} onChange={(e) => setStepsText(e.target.value)} rows={6} required
            placeholder={lang === "hi" ? "चावल धो लें\nतेल गर्म करें..." : "Wash the rice\nHeat oil in a pan..."}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-primary)]" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="premium-btn w-full py-3 disabled:opacity-50">
          {saving ? "..." : lang === "hi" ? "Meal Save Karo" : "Save Meal"}
        </button>
        <Link to="/my-meals" className="block text-center text-sm text-[var(--accent-soft)] hover:underline">
          {lang === "hi" ? "Mere meals dekho" : "View my meals"}
        </Link>
      </form>
    </div>
  );
}
