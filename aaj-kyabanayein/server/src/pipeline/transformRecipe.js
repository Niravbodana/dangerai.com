/**
 * Transform raw recipe draft into full production record.
 */
import { normalizeIngredients } from "./services/ingredientNormalizer.js";
import { calculateNutritionFromIngredients } from "./services/nutritionCalculator.js";
import { generateOriginalRecipeText } from "./services/recipeTextGenerator.js";
import { validateIngredientQuantities, validateTimes } from "./services/quantityValidator.js";
import { buildContentHash, slugify, findDuplicate } from "./services/duplicateDetector.js";
import { generateSeo } from "./services/seoGenerator.js";
import { normalizeAllUnits } from "../intelligence/unitConverter.js";
import { validateRecipeImage } from "../intelligence/imageValidator.js";
import { buildSeoBundle } from "../intelligence/seoBundle.js";
import { runQualityGate } from "../intelligence/qualityGate.js";
import crypto from "crypto";

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

  const ingredients = normalizeAllUnits(normalizeIngredients(raw.ingredients || []));
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
  const duplicateScore = dup.duplicate ? 0.95 : 0;
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

  let steps = text.steps?.length ? text.steps : raw.steps || [];
  let introduction = text.introduction || raw.introduction || "";
  if (steps.length < 2) {
    steps = buildMinimalSteps(title, ingredients, cookTimeMin);
  }
  if (introduction.length < MIN_INTRO_LENGTH) {
    introduction = `A wholesome ${(raw.cuisine || "Indian").replace(/-/g, " ")} ${raw.mealType || "dish"} — ${title}. Made fresh at home with simple ingredients.`;
  }

  const now = new Date().toISOString();
  const imageValidation = validateRecipeImage({
    url: raw.imageUrl || raw.thumbUrl,
    license: raw.imageLicense,
    commercialUseAllowed: raw.imageCommercialUseAllowed,
    author: raw.imageAuthor,
    provider: raw.imageProvider,
    attribution: raw.imageAttribution,
  });

  const recipe = {
    uuid: raw.uuid || crypto.randomUUID(),
    id: raw.id || slug,
    slug,
    title,
    alternateNames: raw.alternateNames || [],
    titleHi: raw.nameHi || raw.titleHi || title,
    introduction,
    cuisine: raw.cuisine || "indian",
    region: raw.region || inferRegion(raw.cuisine),
    state: raw.state || null,
    cityOrigin: raw.cityOrigin || null,
    category: raw.category || raw.mealType,
    mealType: raw.mealType || "lunch",
    diet: raw.diet || ["veg"],
    difficulty: raw.difficulty || "medium",
    servings: raw.servings || 4,
    prepTimeMin,
    cookTimeMin,
    totalTimeMin,
    ingredients,
    optionalIngredients: raw.optionalIngredients || [],
    ingredientAlternatives: text.substitutions || raw.substitutions || [],
    cookingEquipment: raw.cookingEquipment || [],
    cookingMethod: raw.cookingMethod || null,
    temperature: raw.temperature || null,
    steps,
    stepsHi: text.stepsHi?.length ? text.stepsHi : raw.stepsHi || steps,
    chefNotes: text.tips,
    tips: text.tips,
    servingSuggestions: raw.servingSuggestions || null,
    storage: text.storage,
    shelfLife: raw.shelfLife || null,
    reheating: text.reheating,
    commonMistakes: raw.commonMistakes || null,
    substitutions: text.substitutions || [],
    allergens: inferAllergens(ingredients),
    calories: nutrition.calories,
    nutrition,
    nutritionSource: nutrition.dataSource || nutrition.source || "USDA FoodData Central",
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: nutrition.fiberG,
    sugarG: nutrition.sugarG,
    sodiumMg: nutrition.sodiumMg,
    cholesterolMg: raw.cholesterolMg || null,
    vitamins: nutrition.vitamins || {},
    minerals: nutrition.minerals || {},
    recipeTags: raw.tags || [],
    season: raw.season || null,
    festival: raw.festival || null,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    faq: seo.faq,
    imageUrl: imageValidation.metadata?.url || raw.imageUrl || raw.thumbUrl || null,
    imageLicense: imageValidation.metadata?.license || raw.imageLicense || null,
    imageAuthor: imageValidation.metadata?.author || raw.imageAuthor || null,
    imageProvider: imageValidation.metadata?.provider || raw.imageProvider || null,
    imageAttribution: imageValidation.metadata?.attribution || raw.imageAttribution || null,
    imageVerifiedOn: imageValidation.metadata?.verificationDate || null,
    sourceName: raw.dataSource || text.source || "rasoira-curated-modules",
    sourceUrl: raw.sourceUrl || null,
    licenseName: raw.licenseSpdx || text.licenseSpdx || "RASOIRA-CURATED",
    licenseUrl: raw.licenseUrl || null,
    dataSource: raw.dataSource || text.source || "rasoira-curated-modules",
    licenseSpdx: raw.licenseSpdx || text.licenseSpdx || "RASOIRA-CURATED",
    commercialUseAllowed: raw.commercialUseAllowed !== false,
    attributionRequired: raw.attributionRequired === true,
    attributionText: raw.attributionText || nutrition.attributionText || null,
    verificationStatus: raw.verificationStatus || "verified",
    verifiedOn: now,
    importedOn: now,
    lastVerifiedAt: now,
    contentHash: buildContentHash({ title, cuisine: raw.cuisine, mealType: raw.mealType, ingredients }),
    duplicateScore,
    similarityScore: 0,
    tags: raw.tags || [],
    batchId,
  };

  const seoBundle = buildSeoBundle(recipe);
  recipe.seoBundle = seoBundle;
  recipe.seoTitle = seoBundle.seoTitle;
  recipe.seoDescription = seoBundle.seoDescription;
  recipe.canonicalUrl = seoBundle.canonicalUrl;
  recipe.schemaOrg = seoBundle.recipeSchema;

  const quality = runQualityGate(recipe);
  recipe.qualityGate = quality;

  return { ok: true, recipe, quality };
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

const MIN_INTRO_LENGTH = 20;

function buildMinimalSteps(title, ingredients, cookTimeMin) {
  const main = ingredients.slice(0, 3).map((i) => i.name).join(", ");
  return [
    `Gather and prep ingredients for ${title}: ${main || "as listed"}.`,
    `Cook on medium heat for about ${cookTimeMin || 30} minutes, stirring occasionally until done.`,
    `Taste, adjust seasoning, rest 2 minutes and serve warm.`,
  ];
}
