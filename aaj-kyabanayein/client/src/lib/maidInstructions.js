/** Client-side maid instruction preview (server builds full payload). */
export function buildLocalMaidPreview(planMeals = []) {
  return {
    date: new Date().toISOString().split("T")[0],
    meals: planMeals.map((m) => ({
      mealType: m.mealType,
      name: m.recipe?.name,
      nameHi: m.recipe?.nameHi,
    })),
  };
}
