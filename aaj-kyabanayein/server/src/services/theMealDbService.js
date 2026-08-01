const BASE = "https://www.themealdb.com/api/json/v1/1";
const USER_AGENT = "RasoiraMealPlanner/1.0";

function cleanName(name = "") {
  return name
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand|lite|authentic|street|festive|comfort)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return res.json();
}

function mealToIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const qty = meal[`strMeasure${i}`]?.trim();
    if (name) {
      ingredients.push({ name, nameHi: name, quantity: qty || "as needed" });
    }
  }
  return ingredients;
}

function mealToSteps(meal) {
  const text = meal.strInstructions || "";
  return text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\d+[\).\s]+/, "").trim())
    .filter((s) => s.length > 10);
}

export async function searchTheMealDb(name) {
  const queries = [cleanName(name), name].filter(Boolean);
  for (const q of [...new Set(queries)]) {
    const data = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
    const meal = data?.meals?.[0];
    if (!meal) continue;

    const ingredients = mealToIngredients(meal);
    const steps = mealToSteps(meal);
    if (ingredients.length < 2) continue;

    return {
      source: "themealdb",
      name: meal.strMeal,
      imageUrl: meal.strMealThumb,
      ingredients,
      steps: steps.length ? steps : undefined,
      stepsHi: steps.length ? steps : undefined,
      cuisine: meal.strArea?.toLowerCase() || undefined,
    };
  }
  return null;
}
