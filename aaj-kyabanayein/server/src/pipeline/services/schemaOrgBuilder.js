/**
 * Schema.org Recipe JSON-LD builder.
 */

export function buildRecipeJsonLd(recipe) {
  const title = recipe.title || recipe.name;
  const url = `https://rasoira.com/recipe/${recipe.slug || recipe.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: title,
    description: recipe.introduction || recipe.seoDescription || title,
    image: recipe.imageUrl ? [recipe.imageUrl] : undefined,
    author: {
      "@type": "Organization",
      name: "Rasoira",
      url: "https://rasoira.com",
    },
    datePublished: recipe.createdAt || new Date().toISOString().slice(0, 10),
    prepTime: toIsoDuration(recipe.prepTimeMin || 0),
    cookTime: toIsoDuration(recipe.cookTimeMin || recipe.cookTime || 30),
    totalTime: toIsoDuration(recipe.totalTimeMin || (recipe.prepTimeMin || 0) + (recipe.cookTimeMin || recipe.cookTime || 30)),
    recipeYield: `${recipe.servings || 4} servings`,
    recipeCategory: recipe.category || recipe.mealType,
    recipeCuisine: formatCuisine(recipe.cuisine),
    keywords: (recipe.tags || []).join(", ") || undefined,
    recipeIngredient: (recipe.ingredients || []).map(
      (i) => `${i.displayQuantity || i.quantity || ""} ${i.name}`.trim()
    ),
    recipeInstructions: (recipe.steps || []).map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      text: typeof step === "string" ? step : step.text || step.body,
    })),
    nutrition: recipe.nutrition
      ? {
          "@type": "NutritionInformation",
          calories: `${recipe.nutrition.calories || recipe.calories} calories`,
          proteinContent: `${recipe.nutrition.proteinG}g`,
          carbohydrateContent: `${recipe.nutrition.carbsG}g`,
          fatContent: `${recipe.nutrition.fatG}g`,
          fiberContent: recipe.nutrition.fiberG ? `${recipe.nutrition.fiberG}g` : undefined,
          sugarContent: recipe.nutrition.sugarG ? `${recipe.nutrition.sugarG}g` : undefined,
          sodiumContent: recipe.nutrition.sodiumMg ? `${recipe.nutrition.sodiumMg}mg` : undefined,
        }
      : undefined,
  };
}

function toIsoDuration(minutes) {
  const m = Math.max(0, Number(minutes) || 0);
  if (m === 0) return undefined;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `PT${h ? `${h}H` : ""}${rem ? `${rem}M` : ""}`;
}

function formatCuisine(cuisine = "") {
  return String(cuisine).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
