const CUT_KEYWORDS = ["onion", "pyaz", "प्याज", "tomato", "tamatar", "टमाटर", "potato", "aloo", "आलू", "vegetable", "sabzi", "gobi", "गोभी", "palak", "पालक", "carrot", "gajar", "chicken", "chana", "paneer", "mushroom", "bhindi", "baingan", "methi", "mooli"];

const WASH_KEYWORDS = ["rice", "chawal", "चावल", "dal", "दाल", "spinach", "palak", "vegetable", "sabzi", "sprout", "moong"];

const SOAK_KEYWORDS = ["rajma", "chana", "chickpea", "rice", "dal", "sabudana", "urad", "moong"];

const TIMER_KEYWORDS = [
  { words: ["steam", "स्टीम", "भाप"], minutes: 15 },
  { words: ["pressure", "प्रेशर", "cook", "पकाएं", "उबाल"], minutes: 20 },
  { words: ["simmer", "धीमी", "दम"], minutes: 10 },
  { words: ["fry", "तल", "भून", "सेंक"], minutes: 8 },
  { words: ["boil", "उबाल"], minutes: 12 },
  { words: ["rest", "ठंडा", "भिगो"], minutes: 5 },
  { words: ["marinate", "मैरिनेट"], minutes: 30 },
];

function needsCut(name) {
  const lower = name.toLowerCase();
  return CUT_KEYWORDS.some((k) => lower.includes(k));
}

function needsWash(name) {
  const lower = name.toLowerCase();
  return WASH_KEYWORDS.some((k) => lower.includes(k));
}

function needsSoak(name) {
  const lower = name.toLowerCase();
  return SOAK_KEYWORDS.some((k) => lower.includes(k));
}

function inferStepType(text) {
  const t = text.toLowerCase();
  if (t.includes("काट") || t.includes("cut")) return "cut";
  if (t.includes("धो") || t.includes("wash") || t.includes("भिगो") || t.includes("soak")) return "prep";
  if (t.includes("तल") || t.includes("fry") || t.includes("भून")) return "fry";
  if (t.includes("स्टीम") || t.includes("steam")) return "steam";
  if (t.includes("उबाल") || t.includes("boil") || t.includes("प्रेशर")) return "boil";
  if (t.includes("परोस") || t.includes("serve")) return "serve";
  if (t.includes("मिला") || t.includes("mix") || t.includes("मैरिनेट")) return "mix";
  return "cook";
}

function inferDuration(text, totalCookTime) {
  for (const { words, minutes } of TIMER_KEYWORDS) {
    if (words.some((w) => text.toLowerCase().includes(w))) return minutes;
  }
  return Math.max(3, Math.floor(totalCookTime / 4));
}

export function buildCookingFlow(recipe) {
  const flow = [];
  let id = 1;

  flow.push({
    id: id++,
    type: "intro",
    action: "gather",
    title: "Check Ingredients",
    titleHi: "सामग्री चेक करें",
    description: `${recipe.nameHi} banane ke liye yeh ${recipe.ingredients?.length || 0} cheezein chahiye`,
    descriptionHi: `${recipe.nameHi} बनाने के लिए ये सामग्री तैयार रखें`,
    ingredients: recipe.ingredients || [],
    duration: 0,
    icon: "📋",
  });

  for (const ing of recipe.ingredients || []) {
    if (needsWash(ing.name)) {
      flow.push({
        id: id++,
        type: "prep",
        action: "wash",
        title: `Wash ${ing.name}`,
        titleHi: `${ing.nameHi} धो लें`,
        description: `${ing.quantity} ${ing.nameHi} ko achhe se paani se dhoyein`,
        descriptionHi: `${ing.quantity} ${ing.nameHi} को अच्छे से पानी से धोएं`,
        ingredient: ing,
        duration: 2,
        icon: "💧",
      });
    }
    if (needsSoak(ing.name)) {
      flow.push({
        id: id++,
        type: "prep",
        action: "soak",
        title: `Soak ${ing.name}`,
        titleHi: `${ing.nameHi} भिगो दें`,
        description: `${ing.quantity} ${ing.name} ko 2-4 ghante ke liye paani me bhigoyein`,
        descriptionHi: `${ing.quantity} ${ing.nameHi} को २-४ घंटे पानी में भिगोएं`,
        ingredient: ing,
        duration: 120,
        icon: "⏳",
      });
    }
    if (needsCut(ing.name)) {
      const qty = ing.quantity?.match(/\d+/)?.[0] || "required";
      flow.push({
        id: id++,
        type: "cut",
        action: "cut",
        title: `Cut ${ing.name}`,
        titleHi: `${ing.nameHi} काटें`,
        description: `${qty} ${ing.name} ko barik kaat kar bowl me rakhein`,
        descriptionHi: `${ing.quantity} ${ing.nameHi} को बारीक काटकर कटोरे में रखें`,
        ingredient: ing,
        duration: 5,
        icon: "🔪",
      });
    }
  }

  flow.push({
    id: id++,
    type: "prep",
    action: "setup",
    title: "Setup Kitchen",
    titleHi: "रसोई तैयार करें",
    description: "Gas on karein, kadhai/pan garam karein, tel ya ghee taiyar rakhein",
    descriptionHi: "गैस चालू करें, कढ़ाई गर्म करें, तेल या घी तैयार रखें",
    duration: 3,
    icon: "🔥",
  });

  const steps = recipe.stepsHi || recipe.steps || [];
  steps.forEach((stepText, index) => {
    const stepType = inferStepType(stepText);
    const duration = inferDuration(stepText, recipe.cookTime || 30);
    flow.push({
      id: id++,
      type: stepType,
      action: stepType === "serve" ? "serve" : "cook",
      title: `Step ${index + 1}`,
      titleHi: stepText,
      description: stepText,
      descriptionHi: stepText,
      duration: stepType === "serve" ? 0 : duration,
      icon:
        stepType === "fry" ? "🍳" :
        stepType === "steam" ? "♨️" :
        stepType === "boil" ? "🫕" :
        stepType === "mix" ? "🥄" : "👨‍🍳",
    });
  });

  if (!steps.some((s) => s.includes("परोस") || s.toLowerCase().includes("serve"))) {
    flow.push({
      id: id++,
      type: "serve",
      action: "serve",
      title: "Serve Hot!",
      titleHi: "गरमागरम परोसें! 🍽️",
      description: `${recipe.nameHi} ko garam garam plate me parosain. Mazaa lein!`,
      descriptionHi: `${recipe.nameHi} को गरमागरम प्लेट में परोसें। स्वाद लें!`,
      duration: 0,
      icon: "🍽️",
    });
  }

  flow.push({
    id: id++,
    type: "done",
    action: "complete",
    title: "You did it!",
    titleHi: "You did it!",
    description: "If you enjoyed cooking with me, please leave a review ☺️",
    descriptionHi: "If you enjoyed cooking with me, please leave a review ☺️",
    duration: 0,
    icon: "☺️",
  });

  return flow;
}

export function enrichRecipeWithFlow(recipe) {
  return {
    ...recipe,
    cookingFlow: recipe.cookingFlow || buildCookingFlow(recipe),
    totalSteps: (recipe.cookingFlow || buildCookingFlow(recipe)).length,
  };
}
