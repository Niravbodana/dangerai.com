export const COOK_LANGS = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "gu", label: "ગુજરાતી" },
  { id: "mr", label: "मराठी" },
  { id: "hinglish", label: "Hinglish" },
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
  },
  gu: {
    checkIngredients: "સામગ્રી તપાસો",
    setupKitchen: "રસોઈ તૈયાર કરો",
    serveHot: "ગરમ ગરમ પીરસો!",
    youDidIt: "થઈ ગયું! અભિનંદન!",
    reviewMsg: "જો તમને મારી સાથે રસોઈ કરવી ગમી હોય તો કૃપા કરીને review આપો ☺️",
    setupDesc: "ગેસ ચાલુ કરો, કઢાઈ ગરમ કરો, તેલ અથવા ઘી તૈયાર રાખો",
    serveDesc: (name) => `${name} ગરમ ગરમ પ્લેટમાં પીરસો. મજા કરો!`,
    introDesc: (name, n) => `${name} બનાવવા માટે ${n} સામગ્રી જોઈએ`,
    wash: (name, qty) => `${qty} ${name} સારી રીતે પાણીથી ધોવો`,
    soak: (name, qty) => `${qty} ${name} ને ૨-૪ કલાક પાણીમાં ભિજવો`,
    cut: (name, qty) => `${qty} ${name} બારીક કાપીને વાટકીમાં મૂકો`,
    step: (n) => `પગલું ${n}`,
    ingredients: "સામગ્રી",
    startCooking: "રસોઈ શરૂ કરો",
    close: "બંધ",
    back: "પાછળ",
    next: "આગળ",
    review: "રિવ્યૂ આપો ☺️",
    timer: "ટાઈમર",
    min: "મિનિટ",
    steps: "પગલા",
    chooseLang: "ભાષા પસંદ કરો",
  },
  mr: {
    checkIngredients: "साहित्य तपासा",
    setupKitchen: "स्वयंपाकघर तयार करा",
    serveHot: "गरम गरम सर्व्ह करा!",
    youDidIt: "झाले! अभिनंदन!",
    reviewMsg: "जर तुम्हाला माझ्यासोबत cooking आवडले असेल तर कृपया review द्या ☺️",
    setupDesc: "गॅस चालू करा, कढई गरम करा, तेल किंवा तूप तयार ठेवा",
    serveDesc: (name) => `${name} गरम गरम प्लेटमध्ये सर्व्ह करा. मजा करा!`,
    introDesc: (name, n) => `${name} बनवण्यासाठी ${n} साहित्य लागेल`,
    wash: (name, qty) => `${qty} ${name} चांगले पाण्याने धुवा`,
    soak: (name, qty) => `${qty} ${name} २-४ तास पाण्यात भिजवा`,
    cut: (name, qty) => `${qty} ${name} बारीक चिरून वाटीत ठेवा`,
    step: (n) => `पाऊल ${n}`,
    ingredients: "साहित्य",
    startCooking: "स्वयंपाक सुरू करा",
    close: "बंद",
    back: "मागे",
    next: "पुढे",
    review: "रिव्ह्यू द्या ☺️",
    timer: "टाइमर",
    min: "मिनिटे",
    steps: "पाऊले",
    chooseLang: "भाषा निवडा",
  },
  hinglish: {
    checkIngredients: "Ingredients check karo",
    setupKitchen: "Kitchen setup karo",
    serveHot: "Garam garam serve karo!",
    youDidIt: "Ho gaya! Badhai ho!",
    reviewMsg: "Agar aapko mere saath cooking karna accha laga to please review dijiye ☺️",
    setupDesc: "Gas on karo, kadhai garam karo, tel ya ghee ready rakho",
    serveDesc: (name) => `${name} ko garam garam plate mein serve karo. Enjoy!`,
    introDesc: (name, n) => `${name} banane ke liye ${n} cheezein chahiye`,
    wash: (name, qty) => `${qty} ${name} ko achhe se paani se dho lo`,
    soak: (name, qty) => `${qty} ${name} ko 2-4 ghante paani mein bhigo do`,
    cut: (name, qty) => `${qty} ${name} ko barik kaat ke bowl mein rakho`,
    step: (n) => `Step ${n}`,
    ingredients: "Saman / Ingredients",
    startCooking: "Cooking shuru karo",
    close: "Close",
    back: "Back",
    next: "Next step",
    review: "Review do ☺️",
    timer: "Timer",
    min: "min",
    steps: "steps",
    chooseLang: "Language choose karo",
  },
};

export function getCookUI(lang) {
  return UI[lang] || UI.en;
}

export function getRecipeName(recipe, lang) {
  if (lang === "en") return recipe.name;
  if (lang === "hinglish") return `${recipe.nameHi || recipe.name} (${recipe.name})`;
  return recipe.nameHi || recipe.name;
}

export function getIngredientLabel(ing, lang) {
  if (lang === "en") return `${ing.name} — ${ing.quantity}`;
  if (lang === "hinglish") return `${ing.nameHi || ing.name} — ${ing.quantity}`;
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

  if (lang === "hi" || lang === "gu" || lang === "mr") {
    return { title: step.titleHi || step.title, description: step.descriptionHi || step.description };
  }
  if (lang === "hinglish") {
    return {
      title: step.titleHi ? `${step.title} — ${step.titleHi}` : step.title,
      description: step.descriptionHi || step.description,
    };
  }
  return {
    title: step.title || step.titleHi,
    description: step.description || step.descriptionHi,
  };
}
