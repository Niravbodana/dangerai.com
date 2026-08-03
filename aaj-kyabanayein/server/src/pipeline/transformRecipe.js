/**
 * Transform raw recipe draft into full production record.
 */
import { normalizeIngredients } from "./services/ingredientNormalizer.js";
import { calculateNutritionFromIngredients } from "./services/nutritionCalculator.js";
import { generateOriginalRecipeText } from "./services/recipeTextGenerator.js";
import { validateIngredientQuantities, validateTimes } from "./services/quantityValidator.js";
import { buildContentHash, slugify, findDuplicate } from "./services/duplicateDetector.js";
import { generateSeo } from "./services/seoGenerator.js";
import { buildRecipeJsonLd } from "./services/schemaOrgBuilder.js";

/**
 * @param {object} raw - from curated adapter or AI seed
 * @param {object} opts
 */
export async function transformRecipeDraft(raw, opts = {}) {
  const {
    skipAi = false,
    skipNutrition = false,
    existingRecipes = [],
    batchId = null,
  } = opts;

  const ingredients = normalizeIngredients(raw.ingredients || []);
  const qtyCheck = validateIngredientQuantities(ingredients);
  if (!qtyCheck.valid) {
    return { ok: false, error: "quantity_validation", issues: qtyCheck.issues, id: raw.id };
  }

  const prepTimeMin = raw.prepTimeMin || Math.max(5, Math.round((raw.cookTime || 30) * 0.3));
  const cookTimeMin = raw.cookTimeMin || raw.cookTime || 30;
  const totalTimeMin = raw.totalTimeMin || prepTimeMin + cookTimeMin;
  const timeCheck = validateTimes({ prepTimeMin, cookTimeMin, totalTimeMin });
  if (!timeCheck.valid) {
    return { ok: false, error: "time_validation", issues: timeCheck.issues, id: raw.id };
  }

  const dup = findDuplicate(
    { ...raw, title: raw.name, ingredients },
    existingRecipes
  );
  if (dup.duplicate) {
    return { ok: false, error: "duplicate", duplicateOf: dup.duplicateOf, id: raw.id, hash: dup.hash };
  }

  const text = skipAi
    ? {
        title: raw.name,
        introduction: raw.introduction || "",
        steps: raw.steps || [],
        stepsHi: raw.stepsHi || [],
        tips: raw.tips || "",
        storage: raw.storage || "",
        reheating: raw.reheating || "",
        substitutions: raw.substitutions || [],
        licenseSpdx: raw.licenseSpdx || "RASOIRA-CURATED",
        commercialUseAllowed: true,
      }
    : await generateOriginalRecipeText({ ...raw, ingredients, cookTimeMin, prepTimeMin });

  const nutrition = skipNutrition
    ? { calories: raw.calories || 300, source: "estimate" }
    : await calculateNutritionFromIngredients(ingredients, raw.servings || 4);

  const title = text.title || raw.name;
  const slug = raw.slug || slugify(title) || raw.id;
  const seo = generateSeo({ ...raw, title, cookTimeMin, calories: nutrition.calories });

  const recipe = {
    id: raw.id || slug,
    slug,
    title,
    titleHi: raw.nameHi || raw.titleHi || title,
    introduction: text.introduction,
    cuisine: raw.cuisine || "indian",
    region: raw.region || inferRegion(raw.cuisine),
    category: raw.category || raw.mealType,
    mealType: raw.mealType || "lunch",
    diet: raw.diet || ["veg"],
    difficulty: raw.difficulty || "medium",
    servings: raw.servings || 4,
    prepTimeMin,
    cookTimeMin,
    totalTimeMin,
    ingredients,
    steps: text.steps?.length ? text.steps : raw.steps || [],
    stepsHi: text.stepsHi?.length ? text.stepsHi : raw.stepsHi || [],
    tips: text.tips,
    storage: text.storage,
    reheating: text.reheating,
    substitutions: text.substitutions || [],
    allergens: inferAllergens(ingredients),
    calories: nutrition.calories,
    nutrition,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    faq: seo.faq,
    imageUrl: raw.imageUrl || raw.thumbUrl || null,
    imageLicense: raw.imageLicense || null,
    imageAttribution: raw.imageAttribution || null,
    dataSource: raw.dataSource || text.source || "rasoira-curated-modules",
    licenseSpdx: raw.licenseSpdx || text.licenseSpdx || "RASOIRA-CURATED",
    commercialUseAllowed: raw.commercialUseAllowed !== false,
    attributionRequired: raw.attributionRequired === true,
    attributionText: raw.attributionText || nutrition.attributionText || null,
    verificationStatus: raw.verificationStatus || "verified",
    lastVerifiedAt: new Date().toISOString(),
    contentHash: buildContentHash({ title, cuisine: raw.cuisine, mealType: raw.mealType, ingredients }),
    tags: raw.tags || [],
    batchId,
  };

  recipe.schemaOrg = buildRecipeJsonLd(recipe);

  return { ok: true, recipe };
}

function inferRegion(cuisine = "") {
  const map = {
    gujarati: "Gujarat",
    punjabi: "Punjab",
    rajasthani: "Rajasthan",
    maharashtrian: "Maharashtra",
    bengali: "West Bengal",
    "south-indian": "South India",
    "north-indian": "North India",
  };
  return map[cuisine] || null;
}

function inferAllergens(ingredients = []) {
  const blob = ingredients.map((i) => i.name.toLowerCase()).join(" ");
  const allergens = [];
  if (/milk|cheese|paneer|curd|yogurt|butter|ghee|cream/.test(blob)) allergens.push("dairy");
  if (/wheat|flour|bread|maida|atta/.test(blob)) allergens.push("gluten");
  if (/peanut|almond|cashew|nut/.test(blob)) allergens.push("nuts");
  if (/egg/.test(blob)) allergens.push("egg");
  if (/soy|tofu/.test(blob)) allergens.push("soy");
  if (/fish|prawn|shrimp|seafood/.test(blob)) allergens.push("seafood");
  return allergens;
}
