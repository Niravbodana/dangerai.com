import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRecipeImage } from "../data/recipeImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = 10000;

const CUISINE = "indian";

const VEGETABLES = [
  { en: "Aloo", hi: "आलू", pantry: "aloo" },
  { en: "Gobi", hi: "गोभी", pantry: "gobi" },
  { en: "Palak", hi: "पालक", pantry: "palak" },
  { en: "Bhindi", hi: "भिंडी", pantry: "bhindi" },
  { en: "Baingan", hi: "बैंगन", pantry: "baingan" },
  { en: "Mattar", hi: "मटर", pantry: "mattar" },
  { en: "Mushroom", hi: "मशरूम", pantry: "mushroom" },
  { en: "Carrot", hi: "गाजर", pantry: "gajar" },
  { en: "Beans", hi: "बीन्स", pantry: "beans" },
  { en: "Lauki", hi: "लौकी", pantry: "lauki" },
  { en: "Kaddu", hi: "कद्दू", pantry: "kaddu" },
  { en: "Shimla Mirch", hi: "शिमला मिर्च", pantry: "shimla mirch" },
  { en: "Methi", hi: "मेथी", pantry: "methi" },
  { en: "Mooli", hi: "मूली", pantry: "mooli" },
  { en: "Karela", hi: "करेला", pantry: "karela" },
  { en: "Torai", hi: "तोरी", pantry: "torai" },
  { en: "Tinda", hi: "टिंडा", pantry: "tinda" },
  { en: "Arbi", hi: "अरबी", pantry: "arbi" },
  { en: "Kathal", hi: "कटहल", pantry: "kathal" },
  { en: "Drumstick", hi: "सहजन", pantry: "sahjan" },
  { en: "Corn", hi: "भुट्टा", pantry: "corn" },
  { en: "Cabbage", hi: "पत्ता गोभी", pantry: "cabbage" },
  { en: "Capsicum", hi: "शिमला मिर्च", pantry: "capsicum" },
  { en: "Beetroot", hi: "चुकंदर", pantry: "beetroot" },
  { en: "Radish", hi: "मूली", pantry: "mooli" },
];

const VEG_PROTEINS = [
  { en: "Paneer", hi: "पनीर", pantry: "paneer" },
  { en: "Dal", hi: "दाल", pantry: "dal" },
  { en: "Chana", hi: "चना", pantry: "chana" },
  { en: "Rajma", hi: "राजमा", pantry: "rajma" },
  { en: "Soy", hi: "सोया", pantry: "soya" },
  { en: "Moong", hi: "मूंग", pantry: "moong" },
  { en: "Toor", hi: "अरहर", pantry: "toor dal" },
  { en: "Urad", hi: "उड़द", pantry: "urad" },
  { en: "Chole", hi: "छोले", pantry: "chana" },
  { en: "Masoor", hi: "मसूर", pantry: "masoor" },
];

const NONVEG_PROTEINS = [
  { en: "Chicken", hi: "चिकन", pantry: "chicken" },
  { en: "Mutton", hi: "मटन", pantry: "mutton" },
  { en: "Fish", hi: "मछली", pantry: "fish" },
  { en: "Egg", hi: "अंडा", pantry: "egg" },
  { en: "Prawn", hi: "झींगा", pantry: "prawn" },
  { en: "Lamb", hi: "मेमना", pantry: "lamb" },
  { en: "Crab", hi: "केकड़ा", pantry: "crab" },
];

const STYLES = [
  { en: "Curry", hi: "करी", cookTime: 40 },
  { en: "Fry", hi: "फ्राई", cookTime: 25 },
  { en: "Sabzi", hi: "सब्जी", cookTime: 30 },
  { en: "Pulao", hi: "पुलाव", cookTime: 35 },
  { en: "Rosted", hi: "भुना", cookTime: 35 },
  { en: "Masala", hi: "मसाला", cookTime: 45 },
  { en: "Tikka", hi: "टिक्का", cookTime: 40 },
  { en: "Korma", hi: "कोरमा", cookTime: 50 },
  { en: "Bharta", hi: "भरता", cookTime: 35 },
  { en: "Do Pyaza", hi: "दो प्याज़ा", cookTime: 40 },
  { en: "Handi", hi: "हांडी", cookTime: 45 },
  { en: "Jalfrezi", hi: "जालफ्रेजी", cookTime: 35 },
];

const VARIANTS = ["Home Style", "Dhaba Style", "Restaurant", "Traditional", "Quick", "Special"];

const REGIONS = [
  "Punjabi", "South Indian", "Gujarati", "Bengali", "Maharashtrian",
  "Hyderabadi", "Kashmiri", "Rajasthani", "Goan", "Awadhi", "Chettinad", "Mughlai",
];

const SOUTH_INDIAN_DISHES = [
  { en: "Dosa", hi: "डोसा", type: "breakfast" },
  { en: "Idli", hi: "इडली", type: "breakfast" },
  { en: "Uttapam", hi: "उत्तपम", type: "breakfast" },
  { en: "Vada", hi: "वड़ा", type: "breakfast" },
  { en: "Pongal", hi: "पोंगल", type: "breakfast" },
  { en: "Sambar", hi: "सांभर", type: "lunch" },
  { en: "Rasam", hi: "रसम", type: "lunch" },
  { en: "Avial", hi: "अवियल", type: "lunch" },
  { en: "Kootu", hi: "कूटू", type: "lunch" },
  { en: "Bisi Bele Bath", hi: "बिसी बेले भात", type: "lunch" },
  { en: "Lemon Rice", hi: "नींबू चावल", type: "lunch" },
  { en: "Curd Rice", hi: "दही चावल", type: "lunch" },
  { en: "Coconut Rice", hi: "नारियल चावल", type: "lunch" },
  { en: "Poriyal", hi: "पोरियल", type: "dinner" },
  { en: "Thoran", hi: "थोरन", type: "dinner" },
];

const BREAKFAST_VEG = [
  { en: "Poha", hi: "पोहा", pantry: ["poha", "pyaz"] },
  { en: "Upma", hi: "उपमा", pantry: ["suji", "pyaz"] },
  { en: "Paratha", hi: "पराठा", pantry: ["atta", "aloo"] },
  { en: "Chilla", hi: "चिल्ला", pantry: ["besan", "pyaz"] },
  { en: "Thepla", hi: "थेपला", pantry: ["atta", "methi"] },
  { en: "Dosa", hi: "डोसा", pantry: ["chawal", "dal"] },
  { en: "Idli", hi: "इडली", pantry: ["chawal", "urad"] },
  { en: "Khichdi", hi: "खिचड़ी", pantry: ["chawal", "moong"] },
  { en: "Puri", hi: "पूरी", pantry: ["atta", "tel"] },
  { en: "Halwa", hi: "हलवा", pantry: ["suji", "ghee"] },
];

const BREAKFAST_NONVEG = [
  { en: "Egg Bhurji", hi: "अंडा भुर्जी", pantry: ["egg", "pyaz"] },
  { en: "Omelette", hi: "ऑमलेट", pantry: ["egg", "pyaz"] },
  { en: "Egg Paratha", hi: "अंडा पराठा", pantry: ["egg", "atta"] },
  { en: "Chicken Sandwich", hi: "चिकन सैंडविच", pantry: ["chicken", "bread"] },
  { en: "Keema Pav", hi: "कीमा पाव", pantry: ["mutton", "pav"] },
  { en: "Fish Fry", hi: "मछली फ्राई", pantry: ["fish", "atta"] },
];

function slugify(...parts) {
  return parts.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeRecipe(data) {
  const recipe = { cuisine: CUISINE, ...data };
  recipe.image = getRecipeImage(recipe);
  return recipe;
}

function generateVegMeals(mealType, category) {
  const recipes = [];
  for (const veg of VEGETABLES) {
    for (const style of STYLES) {
      for (const variant of VARIANTS) {
        for (const region of REGIONS.slice(0, 4)) {
          const id = slugify("veg", mealType, veg.en, style.en, variant, region);
          recipes.push(makeRecipe({
            id, name: `${variant} ${region} ${veg.en} ${style.en}`,
            nameHi: `${variant} ${region} ${veg.hi} ${style.hi}`,
            mealType, diet: ["veg", "vegan"], category,
            budget: style.cookTime > 40 ? "medium" : "low",
            cookTime: style.cookTime, calories: 250 + Math.floor(Math.random() * 150),
            spice: variant === "Dhaba Style" ? "spicy" : "medium",
            ingredients: [
              { name: veg.en, nameHi: veg.hi, quantity: "2 cups" },
              { name: "Onion", nameHi: "प्याज", quantity: "2 medium" },
              { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
              { name: "Ginger-garlic", nameHi: "अदrak-लहसुन", quantity: "1 tbsp" },
              { name: "Spices", nameHi: "मसाले", quantity: "as needed" },
            ],
            pantryKeys: [veg.pantry, "pyaz", "tamatar", "masala"],
            stepsHi: [
              `${veg.hi} धोकर काट लें।`,
              "प्याज और टमाटर काटकर तैयार करें।",
              "कढ़ाई में तेल गर्म करें, जीरा और हींग डालें।",
              "प्याज सुनहरा होने तक भूनें।",
              `${veg.hi} और मसाले डालकर ${style.hi} बनाएं।`,
              "धीमी आंच पर पकाएं।",
              "गरमागरम रोटी या चावल के साथ परोसें।",
            ],
            tags: [mealType, "veg", region.toLowerCase(), variant.toLowerCase()],
            healthScore: ["Palak", "Lauki", "Karela"].includes(veg.en) ? 8 : 6,
          }));
        }
      }
    }
  }
  return recipes;
}

function generateVegProteinMeals(mealType, category) {
  const recipes = [];
  for (const protein of VEG_PROTEINS) {
    for (const style of STYLES) {
      for (const variant of VARIANTS.slice(0, 4)) {
        const id = slugify("veg-protein", mealType, protein.en, style.en, variant);
        recipes.push(makeRecipe({
          id, name: `${variant} ${protein.en} ${style.en}`,
          nameHi: `${variant} ${protein.hi} ${style.hi}`,
          mealType, diet: protein.en === "Paneer" ? ["veg"] : ["veg", "vegan"],
          category, budget: protein.en === "Paneer" ? "medium" : "low",
          cookTime: style.cookTime, calories: 300 + Math.floor(Math.random() * 120),
          spice: "medium",
          ingredients: [
            { name: protein.en, nameHi: protein.hi, quantity: "1 cup" },
            { name: "Onion", nameHi: "प्याज", quantity: "2" },
            { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
            { name: "Ginger-garlic", nameHi: "अदrak-लहसुन", quantity: "1 tbsp" },
          ],
          pantryKeys: [protein.pantry, "pyaz", "tamatar"],
          stepsHi: [
            `${protein.hi} को धोकर तैयार करें।`,
            "प्याज और टमाटर बारीक काटें।",
            "कढ़ाई में तेल गर्म कर मसाला तैयार करें।",
            `${protein.hi} डालकर अच्छे से मिलाएं।`,
            "धीमी आंच पर पकाएं।",
            "गरम परोसें।",
          ],
          tags: [mealType, "veg", "protein"],
          healthScore: 7,
        }));
      }
    }
  }
  return recipes;
}

function generateNonVegMeals(mealType, category) {
  const recipes = [];
  for (const protein of NONVEG_PROTEINS) {
    for (const style of STYLES) {
      for (const region of REGIONS) {
        for (const variant of VARIANTS.slice(0, 3)) {
          const id = slugify("nonveg", mealType, protein.en, style.en, region, variant);
          recipes.push(makeRecipe({
            id, name: `${variant} ${region} ${protein.en} ${style.en}`,
            nameHi: `${variant} ${region} ${protein.hi} ${style.hi}`,
            mealType, diet: ["non-veg"], category,
            budget: ["Fish", "Prawn", "Crab", "Lamb"].includes(protein.en) ? "high" : "medium",
            cookTime: style.cookTime + 10, calories: 350 + Math.floor(Math.random() * 200),
            spice: region === "Hyderabadi" || region === "Chettinad" ? "spicy" : "medium",
            ingredients: [
              { name: protein.en, nameHi: protein.hi, quantity: "500g" },
              { name: "Onion", nameHi: "प्याज", quantity: "3" },
              { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
              { name: "Ginger-garlic paste", nameHi: "अदrak-लहसुन", quantity: "2 tbsp" },
              { name: "Yogurt", nameHi: "दही", quantity: "1/2 cup" },
            ],
            pantryKeys: [protein.pantry, "pyaz", "tamatar", "dahi"],
            stepsHi: [
              `${protein.hi} को धोकर मसालों में ३० मिनट मैरिनेट करें।`,
              "३ प्याज बारीक काटें, २ टमाटर काटें।",
              "कढ़ाई में तेल गर्म कर प्याज सुनहरा भूनें।",
              "अदrak-लहसुन पेस्ट और टमाटर डालें।",
              `${protein.hi} डालकर ${style.hi} बनाएं।`,
              "धीमी आंच पर नरम होने तक पकाएं।",
              `${region} स्टाइल में गरमागरम परोसें।`,
            ],
            tags: [mealType, "non-veg", region.toLowerCase()],
            healthScore: protein.en === "Fish" ? 7 : 5,
          }));
        }
      }
    }
  }
  return recipes;
}

function generateBreakfast() {
  const recipes = [];
  for (const item of BREAKFAST_VEG) {
    for (const variant of VARIANTS) {
      for (const region of REGIONS.slice(0, 3)) {
        const id = slugify("veg-breakfast", item.en, variant, region);
        recipes.push(makeRecipe({
          id, name: `${variant} ${region} ${item.en}`,
          nameHi: `${variant} ${region} ${item.hi}`,
          mealType: "breakfast", diet: ["veg", "vegan"], category: "veg-breakfast",
          budget: "low", cookTime: 15 + VARIANTS.indexOf(variant) * 3,
          calories: 220 + VARIANTS.indexOf(variant) * 30, spice: "mild",
          ingredients: [
            ...item.pantry.map((p, i) => ({ name: p, nameHi: p, quantity: i === 0 ? "2 cups" : "1" })),
            { name: "Onion", nameHi: "प्याज", quantity: "1" },
            { name: "Oil", nameHi: "तेल", quantity: "2 tbsp" },
          ],
          pantryKeys: [...item.pantry, "pyaz"],
          stepsHi: [
            "सारी सामग्री तैयार करें।",
            "प्याज काटें।",
            `${item.hi} की तैयारी करें।`,
            "कढ़ाई में तेल गर्म करें।",
            "सामग्री डालकर अच्छे से पकाएं।",
            "गरमागरम परोसें।",
          ],
          tags: ["breakfast", "veg"], healthScore: 6,
        }));
      }
    }
  }
  for (const item of BREAKFAST_NONVEG) {
    for (const variant of VARIANTS.slice(0, 4)) {
      const id = slugify("nonveg-breakfast", item.en, variant);
      recipes.push(makeRecipe({
        id, name: `${variant} ${item.en}`, nameHi: `${variant} ${item.hi}`,
        mealType: "breakfast", diet: ["non-veg"], category: "nonveg-breakfast",
        budget: "low", cookTime: 15, calories: 280, spice: variant === "Dhaba Style" ? "spicy" : "mild",
        ingredients: item.pantry.map((p) => ({ name: p, nameHi: p, quantity: "as needed" })),
        pantryKeys: item.pantry,
        stepsHi: ["सामग्री तैयार करें।", "प्याज काटें।", "पकाएं।", "गरम परोसें।"],
        tags: ["breakfast", "non-veg"], healthScore: 6,
      }));
    }
  }
  return recipes;
}

function generateSouthIndian() {
  const recipes = [];
  for (const dish of SOUTH_INDIAN_DISHES) {
    for (const variant of VARIANTS) {
      for (const veg of VEGETABLES.slice(0, 8)) {
        const id = slugify("south-indian", dish.en, variant, veg.en);
        recipes.push(makeRecipe({
          id, name: `${variant} ${veg.en} ${dish.en}`,
          nameHi: `${variant} ${veg.hi} ${dish.hi}`,
          mealType: dish.type, diet: ["veg", "vegan"],
          category: dish.type === "breakfast" ? "veg-breakfast" : `veg-${dish.type}`,
          cuisine: "south-indian", budget: "low",
          cookTime: 30, calories: 280, spice: "medium",
          ingredients: [
            { name: veg.en, nameHi: veg.hi, quantity: "1 cup" },
            { name: "Rice", nameHi: "चावल", quantity: "1 cup" },
            { name: "Coconut", nameHi: "नारियल", quantity: "1/2 cup" },
            { name: "Curry leaves", nameHi: "कड़ी पत्ता", quantity: "10" },
          ],
          pantryKeys: [veg.pantry, "chawal", "nariyal"],
          stepsHi: [
            `${veg.hi} धोकर काटें।`,
            "चावल धोकर पकाएं।",
            `${dish.hi} की मसाला तैयार करें।`,
            "नारियल और कड़ी पत्ता डालें।",
            "सब मिलाकर पकाएं।",
            "गरम परोसें।",
          ],
          tags: ["south-indian", dish.type, "veg"],
          healthScore: 7,
        }));
      }
    }
  }
  return recipes;
}

function generateHealthy() {
  const recipes = [];
  const items = [
    { name: "Oats Upma", nameHi: "ओट्स उपमा", pantry: ["oats", "pyaz"] },
    { name: "Sprout Salad", nameHi: "अंकुरित सलाद", pantry: ["moong", "tamatar"] },
    { name: "Ragi Dosa", nameHi: "रागी डोसा", pantry: ["ragi", "chawal"] },
    { name: "Quinoa Pulao", nameHi: "क्विनोआ पुलाव", pantry: ["quinoa", "sabzi"] },
    { name: "Steamed Veg", nameHi: "स्टीम्ड सब्जी", pantry: ["sabzi"] },
    { name: "Moong Soup", nameHi: "मूंग सूप", pantry: ["moong", "adrak"] },
    { name: "Brown Rice", nameHi: "ब्राउन राइस", pantry: ["brown rice"] },
    { name: "Bajra Roti", nameHi: "बाजरा रोटी", pantry: ["bajra", "atta"] },
  ];
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  for (const item of items) {
    for (const mealType of mealTypes) {
      for (const v of VARIANTS.slice(0, 3)) {
        const id = slugify("healthy", mealType, item.name, v);
        recipes.push(makeRecipe({
          id, name: `${v} Healthy ${item.name}`, nameHi: `${v} हेल्दी ${item.nameHi}`,
          mealType, diet: ["veg", "vegan", "diabetic"], category: "healthy",
          budget: "medium", cookTime: 25, calories: 180, spice: "mild",
          ingredients: item.pantry.map((p) => ({ name: p, nameHi: p, quantity: "1 cup" })),
          pantryKeys: item.pantry,
          stepsHi: ["सामग्री धोएं।", "कम तेल में पकाएं।", "हल्का मसाला डालें।", "ताजा परोसें।"],
          tags: ["healthy", mealType], healthScore: 9,
        }));
      }
    }
  }
  return recipes;
}

console.log("Generating recipes...");
const all = [
  ...generateBreakfast(),
  ...generateVegMeals("lunch", "veg-lunch"),
  ...generateVegMeals("dinner", "veg-dinner"),
  ...generateVegProteinMeals("lunch", "veg-lunch"),
  ...generateVegProteinMeals("dinner", "veg-dinner"),
  ...generateNonVegMeals("lunch", "nonveg-lunch"),
  ...generateNonVegMeals("dinner", "nonveg-dinner"),
  ...generateSouthIndian(),
  ...generateHealthy(),
];

const unique = new Map();
for (const r of all) {
  if (!unique.has(r.id)) unique.set(r.id, r);
}

let finalRecipes = Array.from(unique.values());
console.log(`Generated ${finalRecipes.length} unique recipes`);

if (finalRecipes.length < TARGET) {
  console.log(`Expanding to reach ${TARGET}...`);
  const extra = [];
  let counter = 0;
  while (finalRecipes.length + extra.length < TARGET) {
    const base = finalRecipes[counter % finalRecipes.length];
    const newId = slugify(base.id, "v", counter);
    if (!unique.has(newId)) {
      const variant = VARIANTS[counter % VARIANTS.length];
      const r = makeRecipe({
        ...base,
        id: newId,
        name: `${variant} ${base.name}`,
        nameHi: `${variant} ${base.nameHi}`,
      });
      extra.push(r);
      unique.set(newId, r);
    }
    counter++;
    if (counter > TARGET * 3) break;
  }
  finalRecipes = [...finalRecipes, ...extra];
}

console.log(`Final count: ${finalRecipes.length}`);

const outPath = path.join(__dirname, "../data/generatedRecipes.json");
fs.writeFileSync(outPath, JSON.stringify(finalRecipes));
console.log(`Written to ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(1)} MB)`);
