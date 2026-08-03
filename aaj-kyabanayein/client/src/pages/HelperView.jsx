import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HelperView() {
  const token = window.location.pathname.split("/helper/")[1]?.split("/")[0];
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/maid/view/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((body) => {
        if (!body.success) setError(body.message || "Link invalid");
        else setData(body);
      })
      .catch(() => setError("Load failed"));
  }, [token]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[var(--text-secondary)]">{error}</p>
        <Link to="/" className="premium-btn mt-4 inline-block px-4 py-2 text-sm">Home</Link>
      </div>
    );
  }

  if (!data) {
    return <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  }

  const { helperName, instructions } = data;
  const lang = instructions.language === "hi";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass-strong rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Maid / Helper Mode</p>
        <h1 className="mt-2 font-display text-2xl text-[var(--text-primary)]">
          {lang ? `Namaste ${helperName}` : `Hello ${helperName}`}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{instructions.intro}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{instructions.date}</p>
      </div>

      <div className="mt-6 space-y-6">
        {instructions.meals.map((meal) => (
          <article key={meal.mealType} className="recipe-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">{meal.mealType}</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
              {lang ? meal.nameHi || meal.name : meal.name}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">{meal.cookTime} min</p>

            <h3 className="mt-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">
              {lang ? "सामग्री" : "Ingredients"}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-primary)]">
              {meal.ingredients.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <h3 className="mt-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">
              {lang ? "तरीका" : "Steps"}
            </h3>
            <ol className="mt-2 space-y-2 text-sm text-[var(--text-primary)]">
              {meal.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>

            <Link
              to={`/cook/${meal.name}`}
              className="premium-btn-outline mt-4 inline-block px-3 py-2 text-xs"
              onClick={(e) => e.preventDefault()}
            >
              {lang ? "धीरे-धीरे पढ़ें" : "Read slowly"}
            </Link>
          </article>
        ))}
      </div>

      {instructions.meals.length === 0 && (
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Aaj ke liye abhi plan set nahi hai. Ghar wale plan bhejenge.
        </p>
      )}
    </div>
  );
}
