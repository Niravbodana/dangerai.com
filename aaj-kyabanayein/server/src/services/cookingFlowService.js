/**
 * Simple instruction-only cooking flow — no timers, no prep injection.
 */
export function buildCookingFlow(recipe) {
  const stepsEn = recipe.steps?.length ? recipe.steps : [];
  const stepsHi = recipe.stepsHi?.length ? recipe.stepsHi : stepsEn;
  const flow = [];

  flow.push({
    id: 0,
    type: "intro",
    title: "Ingredients ready?",
    titleHi: "सामग्री तैयार है?",
    description: `Gather ${recipe.ingredients?.length || 0} ingredients before you start.`,
    descriptionHi: `${recipe.ingredients?.length || 0} सामग्री तैयार रखें।`,
    icon: "📋",
  });

  const maxLen = Math.max(stepsEn.length, stepsHi.length);
  for (let i = 0; i < maxLen; i++) {
    flow.push({
      id: i + 1,
      type: "cook",
      title: stepsEn[i] || `Step ${i + 1}`,
      titleHi: stepsHi[i] || stepsEn[i] || `कदम ${i + 1}`,
      description: stepsEn[i] || "",
      descriptionHi: stepsHi[i] || stepsEn[i] || "",
      icon: "👨‍🍳",
    });
  }

  flow.push({
    id: maxLen + 1,
    type: "done",
    title: "Done! Enjoy your meal 🍽️",
    titleHi: "हो गया! खाना एंजॉय करें 🍽️",
    description: "Great job! Share your experience with a review.",
    descriptionHi: "बहुत बढ़िया! रिव्यू देकर अपना अनुभव शेयर करें।",
    icon: "☺️",
  });

  return flow;
}

export function enrichRecipeWithFlow(recipe) {
  const flow = recipe.cookingFlow || buildCookingFlow(recipe);
  return { ...recipe, cookingFlow: flow, totalSteps: flow.length };
}
