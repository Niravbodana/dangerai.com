/** Format ingredients for WhatsApp / clipboard */
export function formatIngredientsList(recipe, lang = "en") {
  const lines = (recipe.ingredients || []).map((ing, i) => {
    const name = lang === "hi" ? (ing.nameHi || ing.name) : ing.name;
    return `${i + 1}. ${name} — ${ing.quantity || ""}`.trim();
  });
  const title = lang === "hi" ? (recipe.nameHi || recipe.name) : recipe.name;
  return `🛒 *${title}* — Ingredients\n\n${lines.join("\n")}\n\n— Rasoira`;
}

export async function copyIngredients(recipe, lang = "en") {
  const text = formatIngredientsList(recipe, lang);
  await navigator.clipboard.writeText(text);
  return text;
}

export function printRecipe(recipe, lang = "en") {
  const name = lang === "hi" ? (recipe.nameHi || recipe.name) : recipe.name;
  const steps = lang === "hi"
    ? (recipe.stepsHi?.length ? recipe.stepsHi : recipe.steps)
    : (recipe.steps?.length ? recipe.steps : recipe.stepsHi);

  const ingredientRows = (recipe.ingredients || [])
    .map((ing, i) => {
      const ingName = lang === "hi" ? (ing.nameHi || ing.name) : ing.name;
      return `<li><strong>${ingName}</strong> — ${ing.quantity || ""}</li>`;
    })
    .join("");

  const stepRows = (steps || [])
    .map((step, i) => `<li>${step}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${name}</title>
<style>
  body { font-family: Georgia, serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
  h2 { font-size: 1.1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; margin-top: 1.5rem; }
  ul, ol { line-height: 1.6; }
  .footer { margin-top: 2rem; font-size: 0.8rem; color: #888; }
</style></head><body>
  <h1>${name}</h1>
  <p class="meta">${recipe.cookTime || ""} min · ${recipe.calories || ""} cal · ${recipe.cuisine || ""}</p>
  <h2>Ingredients</h2>
  <ul>${ingredientRows}</ul>
  ${stepRows ? `<h2>Steps</h2><ol>${stepRows}</ol>` : ""}
  <p class="footer">Printed from Rasoira — home cooked food</p>
</body></html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
