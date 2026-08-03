/**
 * SEO metadata generator — original copy, not scraped.
 */

export function generateSeo(recipe) {
  const title = recipe.title || recipe.name || "Recipe";
  const cuisine = formatLabel(recipe.cuisine);
  const mealType = formatLabel(recipe.mealType);
  const diet = (recipe.diet || []).join(", ") || "homestyle";
  const cookTime = recipe.cookTimeMin || recipe.cookTime || 30;
  const calories = recipe.calories || recipe.nutrition?.calories;

  const seoTitle = `${title} Recipe | ${cuisine} ${mealType} | Rasoira`.slice(0, 60);
  const seoDescription = [
    `Learn to make ${title} — a ${diet} ${cuisine} ${mealType} recipe.`,
    `Ready in about ${cookTime} minutes.`,
    calories ? `Approx. ${calories} kcal per serving.` : null,
    "Step-by-step instructions, ingredients list and nutrition on Rasoira.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  const faq = buildFaq(recipe, title, cookTime, calories);

  return { seoTitle, seoDescription, faq };
}

function buildFaq(recipe, title, cookTime, calories) {
  const faq = [
    {
      question: `How long does ${title} take to cook?`,
      answer: `This recipe takes approximately ${cookTime} minutes total.`,
    },
    {
      question: `What cuisine is ${title}?`,
      answer: `${title} is a ${formatLabel(recipe.cuisine)} dish.`,
    },
  ];

  if (calories) {
    faq.push({
      question: `How many calories are in ${title}?`,
      answer: `Approximately ${calories} calories per serving (calculated from USDA ingredient data).`,
    });
  }

  if (recipe.storage) {
    faq.push({
      question: `How should I store leftover ${title}?`,
      answer: recipe.storage,
    });
  }

  return faq;
}

function formatLabel(s = "") {
  return String(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
