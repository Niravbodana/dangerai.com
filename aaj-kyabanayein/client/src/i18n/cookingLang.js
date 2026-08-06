/** Cooking-mode language options — kept to Hindi + English only so the
 * voice narration always matches an installed, natural-sounding OS voice. */
export const COOK_LANGS = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
];

const UI = {
  en: {
    checkIngredients: "Check Ingredients",
    setupKitchen: "Setup Kitchen",
    serveHot: "Serve Hot!",
    youDidIt: "You did it!",
    reviewMsg: "If you enjoyed cooking with me, please leave a review ☺️",
    setupDesc: "Turn on the stove, heat your pan, keep oil or ghee ready",
    serveDesc: (name) => `Serve ${name} hot on a plate. Enjoy!`,
    introDesc: (name, n) => `You need ${n} ingredients to make ${name}`,
    wash: (name, qty) => `Wash ${qty} ${name} thoroughly with water`,
    soak: (name, qty) => `Soak ${qty} ${name} in water for 2–4 hours`,
    cut: (name, qty) => `Finely chop ${qty} ${name} and keep in a bowl`,
    step: (n) => `Step ${n}`,
    ingredients: "Ingredients",
    startCooking: "Start Cooking",
    close: "Close",
    back: "Back",
    next: "Next Step",
    review: "Leave a Review ☺️",
    timer: "Timer",
    min: "min",
    steps: "steps",
    chooseLang: "Cooking language",
    keyboardHint: "Space = next · ← → navigate · R = repeat",
    mobileHint: "Tap Next — use 🔊 to hear each step",
    swipeHint: "Swipe ← → between steps",
  },
  hi: {
    checkIngredients: "सामग्री चेक करें",
    setupKitchen: "रसोई तैयार करें",
    serveHot: "गरमागरम परोसें!",
    youDidIt: "हो गया! बधाई हो!",
    reviewMsg: "अगर आपको मेरे साथ cooking करना अच्छा लगा तो please review दीजिए ☺️",
    setupDesc: "गैस चालू करें, कढ़ाई गर्म करें, तेल या घी तैयार रखें",
    serveDesc: (name) => `${name} को गरमागरम प्लेट में परोसें। स्वाद लें!`,
    introDesc: (name, n) => `${name} बनाने के लिए ये ${n} सामग्री तैयार रखें`,
    wash: (name, qty) => `${qty} ${name} को अच्छे से पानी से धोएं`,
    soak: (name, qty) => `${qty} ${name} को २-४ घंटे पानी में भिगोएं`,
    cut: (name, qty) => `${qty} ${name} को बारीक काटकर कटोरे में रखें`,
    step: (n) => `कदम ${n}`,
    ingredients: "सामग्री",
    startCooking: "पकाना शुरू करें",
    close: "बंद करें",
    back: "पीछे",
    next: "अगला कदम",
    review: "रिव्यू दें ☺️",
    timer: "टाइमर",
    min: "मिनट",
    steps: "कदम",
    chooseLang: "भाषा चुनें",
    keyboardHint: "Space = अगला · ← → पीछे/आगे · R = दोहराएं",
    mobileHint: "अगला कदम दबाएं — 🔊 से सुनें",
    swipeHint: "Swipe करें ← →",
  },
};

export function getCookUI(lang) {
  return UI[lang] || UI.en;
}

export function getRecipeName(recipe, lang) {
  if (lang === "en") return recipe.name;
  return recipe.nameHi || recipe.name;
}

export function getIngredientLabel(ing, lang) {
  if (lang === "en") return `${ing.name} — ${ing.quantity}`;
  return `${ing.nameHi || ing.name} — ${ing.quantity}`;
}

export function resolveCookingStep(step, lang, recipe) {
  const ui = getCookUI(lang);
  const name = getRecipeName(recipe, lang);
  const ing = step.ingredient;

  switch (step.type) {
    case "intro":
      return {
        title: ui.checkIngredients,
        description: ui.introDesc(name, recipe.ingredients?.length || 0),
      };
    case "prep":
      if (step.action === "setup") {
        return { title: ui.setupKitchen, description: ui.setupDesc };
      }
      if (step.action === "wash" && ing) {
        return {
          title: ui.wash(ing.nameHi || ing.name, ing.quantity),
          description: ui.wash(ing.nameHi || ing.name, ing.quantity),
        };
      }
      if (step.action === "soak" && ing) {
        return {
          title: ui.soak(ing.nameHi || ing.name, ing.quantity),
          description: ui.soak(ing.nameHi || ing.name, ing.quantity),
        };
      }
      break;
    case "cut":
      if (ing) {
        return {
          title: ui.cut(ing.nameHi || ing.name, ing.quantity),
          description: ui.cut(ing.nameHi || ing.name, ing.quantity),
        };
      }
      break;
    case "serve":
      return { title: ui.serveHot, description: ui.serveDesc(name) };
    case "done":
      return { title: ui.youDidIt, description: ui.reviewMsg };
    default:
      break;
  }

  if (lang === "hi") {
    return { title: step.titleHi || step.title, description: step.descriptionHi || step.description };
  }
  return {
    title: step.title || step.titleHi,
    description: step.description || step.descriptionHi,
  };
}
