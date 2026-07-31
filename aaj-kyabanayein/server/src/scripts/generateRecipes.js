import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRecipeImage } from "../data/recipeImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
];

const VEG_PROTEINS = [
  { en: "Paneer", hi: "पनीर", pantry: "paneer" },
  { en: "Dal", hi: "दाल", pantry: "dal" },
  { en: "Chana", hi: "चना", pantry: "chana" },
  { en: "Rajma", hi: "राजमा", pantry: "rajma" },
  { en: "Soy", hi: "सोया", pantry: "soya" },
  { en: "Moong", hi: "मूंग", pantry: "moong" },
  { en: "Toor", hi: "अरहर", pantry: "toor dal" },
];

const NONVEG_PROTEINS = [
  { en: "Chicken", hi: "चिकन", pantry: "chicken" },
  { en: "Mutton", hi: "मटन", pantry: "mutton" },
  { en: "Fish", hi: "मछली", pantry: "fish" },
  { en: "Egg", hi: "अंडा", pantry: "egg" },
  { en: "Prawn", hi: "झींगा", pantry: "prawn" },
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
];

const BREAKFAST_VEG = [
  { en: "Poha", hi: "पोहा", pantry: ["poha", "pyaz"] },
  { en: "Upma", hi: "उपमा", pantry: ["suji", "pyaz"] },
  { en: "Paratha", hi: "पराठा", pantry: ["atta", "aloo"] },
  { en: "Chilla", hi: "चिल्ला", pantry: ["besan", "pyaz"] },
  { en: "Thepla", hi: "थेपला", pantry: ["atta", "methi"] },
  { en: "Dosa", hi: "डोसा", pantry: ["chawal", "dal"] },
  { en: "Idli", hi: "इडली", pantry: ["chawal", "urad"] },
  { en: "Uttapam", hi: "उत्तपम", pantry: ["chawal", "pyaz"] },
  { en: "Pongal", hi: "पोंगल", pantry: ["chawal", "dal"] },
  { en: "Khichdi", hi: "खिचड़ी", pantry: ["chawal", "moong"] },
];

const BREAKFAST_NONVEG = [
  { en: "Egg Bhurji", hi: "अंडा भुर्जी", pantry: ["egg", "pyaz"] },
  { en: "Omelette", hi: "ऑमलेट", pantry: ["egg", "pyaz"] },
  { en: "Egg Paratha", hi: "अंडा पराठा", pantry: ["egg", "atta"] },
  { en: "Chicken Sandwich", hi: "चिकन सैंडविच", pantry: ["chicken", "bread"] },
  { en: "Keema Pav", hi: "कीमा पाव", pantry: ["mutton", "pav"] },
  { en: "Fish Fry", hi: "मछली फ्राई", pantry: ["fish", "atta"] },
];

const REGIONS = ["Punjabi", "South Indian", "Gujarati", "Bengali", "Maharashtrian", "Hyderabadi"];

const COMMON_PANTRY = [
  { en: "Onion", hi: "प्याज", pantry: "pyaz" },
  { en: "Tomato", hi: "टमाटर", pantry: "tamatar" },
  { en: "Rice", hi: "चावल", pantry: "chawal" },
  { en: "Wheat flour", hi: "गेहूं का आटा", pantry: "atta" },
  { en: "Oil", hi: "तेल", pantry: "tel" },
  { en: "Spices", hi: "मसाले", pantry: "masala" },
];

function slugify(...parts) {
  return parts.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function makeRecipe({
  id,
  name,
  nameHi,
  mealType,
  diet,
  category,
  budget,
  cookTime,
  calories,
  spice,
  ingredients,
  pantryKeys,
  stepsHi,
  tags,
  healthScore,
}) {
  const recipe = {
    id,
    name,
    nameHi,
    mealType,
    diet,
    category,
    budget,
    cookTime,
    calories,
    spice,
    ingredients,
    pantryKeys,
    stepsHi,
    tags,
    healthScore: healthScore ?? 5,
  };
  recipe.image = getRecipeImage(recipe);
  return recipe;
}

function generateVegMeals(mealType, category) {
  const recipes = [];
  for (const veg of VEGETABLES) {
    for (const style of STYLES) {
      const id = slugify("veg", mealType, veg.en, style.en);
      recipes.push(
        makeRecipe({
          id,
          name: `${veg.en} ${style.en}`,
          nameHi: `${veg.hi} ${style.hi}`,
          mealType,
          diet: ["veg", "vegan"],
          category,
          budget: style.cookTime > 40 ? "medium" : "low",
          cookTime: style.cookTime,
          calories: 250 + Math.floor(Math.random() * 150),
          spice: "medium",
          ingredients: [
            { name: veg.en, nameHi: veg.hi, quantity: "2 cups" },
            { name: "Onion", nameHi: "प्याज", quantity: "1" },
            { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
            { name: "Spices", nameHi: "मसाले", quantity: "as needed" },
          ],
          pantryKeys: [veg.pantry, "pyaz", "tamatar", "masala"],
          stepsHi: [
            `${veg.hi} धोकर काट लें।`,
            "प्याज-टमाटर की मसाला तैयार करें।",
            `${veg.hi} डालकर ${style.hi} बनाएं।`,
            "गरमागरम रोटी या चावल के साथ परोसें।",
          ],
          tags: [mealType, "veg", style.en.toLowerCase()],
          healthScore: veg.en === "Palak" || veg.en === "Lauki" ? 8 : 6,
        })
      );
    }
  }

  for (const protein of VEG_PROTEINS) {
    for (const style of STYLES.slice(0, 5)) {
      const id = slugify("veg", mealType, protein.en, style.en);
      recipes.push(
        makeRecipe({
          id,
          name: `${protein.en} ${style.en}`,
          nameHi: `${protein.hi} ${style.hi}`,
          mealType,
          diet: protein.en === "Paneer" ? ["veg"] : ["veg", "vegan"],
          category,
          budget: protein.en === "Paneer" ? "medium" : "low",
          cookTime: style.cookTime,
          calories: 300 + Math.floor(Math.random() * 120),
          spice: "medium",
          ingredients: [
            { name: protein.en, nameHi: protein.hi, quantity: "1 cup" },
            { name: "Onion", nameHi: "प्याज", quantity: "1" },
            { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
          ],
          pantryKeys: [protein.pantry, "pyaz", "tamatar"],
          stepsHi: [
            `${protein.hi} तैयार करें।`,
            "मसाला भूनें।",
            `${protein.hi} डालकर पकाएं।`,
            "गरम परोसें।",
          ],
          tags: [mealType, "veg", "protein"],
          healthScore: 7,
        })
      );
    }
  }
  return recipes;
}

function generateNonVegMeals(mealType, category) {
  const recipes = [];
  for (const protein of NONVEG_PROTEINS) {
    for (const style of STYLES) {
      for (const region of REGIONS.slice(0, 3)) {
        const id = slugify("nonveg", mealType, protein.en, style.en, region);
        recipes.push(
          makeRecipe({
            id,
            name: `${region} ${protein.en} ${style.en}`,
            nameHi: `${region} ${protein.hi} ${style.hi}`,
            mealType,
            diet: ["non-veg"],
            category,
            budget: protein.en === "Fish" || protein.en === "Prawn" ? "high" : "medium",
            cookTime: style.cookTime + 10,
            calories: 350 + Math.floor(Math.random() * 200),
            spice: region === "Hyderabadi" ? "spicy" : "medium",
            ingredients: [
              { name: protein.en, nameHi: protein.hi, quantity: "500g" },
              { name: "Onion", nameHi: "प्याज", quantity: "2" },
              { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
              { name: "Ginger-garlic", nameHi: "अदrak-लहसुन", quantity: "1 tbsp" },
            ],
            pantryKeys: [protein.pantry, "pyaz", "tamatar", "adrak", "lahsun"],
            stepsHi: [
              `${protein.hi} को मसाले में मैरिनेट करें।`,
              "प्याज-टमाटर की मसाला बनाएं।",
              `${protein.hi} डालकर धीमी आंच पर पकाएं।`,
              `${region} स्टाइल में गरम परोसें।`,
            ],
            tags: [mealType, "non-veg", region.toLowerCase()],
            healthScore: protein.en === "Fish" ? 7 : 5,
          })
        );
      }
    }
  }
  return recipes;
}

function generateBreakfast() {
  const recipes = [];
  for (const item of BREAKFAST_VEG) {
    for (let i = 0; i < 3; i++) {
      const variant = ["Classic", "Masala", "Special"][i];
      const id = slugify("veg-breakfast", item.en, variant);
      recipes.push(
        makeRecipe({
          id,
          name: `${variant} ${item.en}`,
          nameHi: `${variant} ${item.hi}`,
          mealType: "breakfast",
          diet: ["veg", "vegan"],
          category: "veg-breakfast",
          budget: "low",
          cookTime: 15 + i * 5,
          calories: 220 + i * 30,
          spice: i === 1 ? "medium" : "mild",
          ingredients: item.pantry.map((p, idx) => ({
            name: p,
            nameHi: p,
            quantity: idx === 0 ? "2 cups" : "1",
          })),
          pantryKeys: item.pantry,
          stepsHi: [
            `${item.hi} की सामग्री तैयार करें।`,
            "मसाले मिलाएं।",
            "अच्छे से पकाएं।",
            "गरमागरम परोसें।",
          ],
          tags: ["breakfast", "veg", variant.toLowerCase()],
          healthScore: item.en === "Khichdi" || item.en === "Pongal" ? 8 : 6,
        })
      );
    }
  }

  for (const item of BREAKFAST_NONVEG) {
    for (let i = 0; i < 2; i++) {
      const variant = ["Classic", "Spicy"][i];
      const id = slugify("nonveg-breakfast", item.en, variant);
      recipes.push(
        makeRecipe({
          id,
          name: `${variant} ${item.en}`,
          nameHi: `${variant} ${item.hi}`,
          mealType: "breakfast",
          diet: ["non-veg"],
          category: "nonveg-breakfast",
          budget: "low",
          cookTime: 15,
          calories: 280,
          spice: i === 1 ? "spicy" : "mild",
          ingredients: item.pantry.map((p) => ({ name: p, nameHi: p, quantity: "as needed" })),
          pantryKeys: item.pantry,
          stepsHi: [
            "सामग्री तैयार करें।",
            "पकाएं।",
            "गरम परोसें।",
          ],
          tags: ["breakfast", "non-veg"],
          healthScore: 6,
        })
      );
    }
  }
  return recipes;
}

function generateHealthyRecipes() {
  const recipes = [];
  const healthyItems = [
    { name: "Oats Upma", nameHi: "ओट्स उपमा", pantry: ["oats", "pyaz"] },
    { name: "Sprout Salad", nameHi: "अंकुरित सलाद", pantry: ["moong", "tamatar"] },
    { name: "Ragi Dosa", nameHi: "रागी डोसा", pantry: ["ragi", "chawal"] },
    { name: "Quinoa Pulao", nameHi: "क्विनोआ पुलाव", pantry: ["quinoa", "sabzi"] },
    { name: "Grilled Paneer", nameHi: "ग्रिल्ड पनीर", pantry: ["paneer", "shimla mirch"] },
    { name: "Steamed Veg", nameHi: "स्टीम्ड सब्जी", pantry: ["sabzi", "namak"] },
    { name: "Moong Dal Soup", nameHi: "मूंग दाल सूप", pantry: ["moong", "adrak"] },
    { name: "Fruit Bowl", nameHi: "फ्रूट बाउल", pantry: ["fruit", "dahi"] },
    { name: "Brown Rice Khichdi", nameHi: "ब्राउन राइस खिचड़ी", pantry: ["brown rice", "moong"] },
    { name: "Bajra Roti Sabzi", nameHi: "बाजरा रोटी सब्जी", pantry: ["bajra", "sabzi"] },
  ];

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  for (const item of healthyItems) {
    for (const mealType of mealTypes) {
      const id = slugify("healthy", mealType, item.name);
      recipes.push(
        makeRecipe({
          id,
          name: `Healthy ${item.name}`,
          nameHi: `हेल्दी ${item.nameHi}`,
          mealType,
          diet: ["veg", "vegan", "diabetic"],
          category: "healthy",
          budget: "medium",
          cookTime: 25,
          calories: 180 + Math.floor(Math.random() * 80),
          spice: "mild",
          ingredients: item.pantry.map((p) => ({ name: p, nameHi: p, quantity: "1 cup" })),
          pantryKeys: item.pantry,
          stepsHi: [
            "स्वस्थ सामग्री तैयार करें।",
            "कम तेल में पकाएं।",
            "हल्का मसाला डालें।",
            "ताजा परोसें।",
          ],
          tags: ["healthy", "low-oil", mealType],
          healthScore: 9,
        })
      );
    }
  }
  return recipes;
}

function generateComboDishes() {
  const recipes = [];
  const combos = [
    { name: "Dal Rice", nameHi: "दाल चावल", pantry: ["dal", "chawal"], mealType: "lunch" },
    { name: "Rajma Rice", nameHi: "राजमा चावल", pantry: ["rajma", "chawal"], mealType: "lunch" },
    { name: "Chole Roti", nameHi: "छोले रोटी", pantry: ["chana", "atta"], mealType: "lunch" },
    { name: "Curd Rice", nameHi: "दही चावल", pantry: ["dahi", "chawal"], mealType: "lunch" },
    { name: "Roti Sabzi", nameHi: "रोटी सब्जी", pantry: ["atta", "sabzi"], mealType: "dinner" },
    { name: "Paneer Roti", nameHi: "पनीर रोटी", pantry: ["paneer", "atta"], mealType: "dinner" },
  ];

  for (const combo of combos) {
    for (let v = 1; v <= 5; v++) {
      const id = slugify("combo", combo.name, `v${v}`);
      recipes.push(
        makeRecipe({
          id,
          name: `${combo.name} Style ${v}`,
          nameHi: `${combo.nameHi} स्टाइल ${v}`,
          mealType: combo.mealType,
          diet: ["veg"],
          category: combo.mealType.includes("breakfast") ? "veg-breakfast" : `veg-${combo.mealType}`,
          budget: "low",
          cookTime: 30 + v * 5,
          calories: 350,
          spice: "mild",
          ingredients: combo.pantry.map((p) => ({ name: p, nameHi: p, quantity: "1 cup" })),
          pantryKeys: combo.pantry,
          stepsHi: ["सामग्री तैयार करें।", "पकाएं।", "परोसें।"],
          tags: ["combo", "daily"],
          healthScore: 7,
        })
      );
    }
  }
  return recipes;
}

const all = [
  ...generateBreakfast(),
  ...generateVegMeals("lunch", "veg-lunch"),
  ...generateVegMeals("dinner", "veg-dinner"),
  ...generateNonVegMeals("lunch", "nonveg-lunch"),
  ...generateNonVegMeals("dinner", "nonveg-dinner"),
  ...generateHealthyRecipes(),
  ...generateComboDishes(),
];

const unique = new Map();
for (const r of all) {
  if (!unique.has(r.id)) unique.set(r.id, r);
}

const finalRecipes = Array.from(unique.values());
console.log(`Generated ${finalRecipes.length} recipes`);

const outPath = path.join(__dirname, "../data/generatedRecipes.json");
fs.writeFileSync(outPath, JSON.stringify(finalRecipes, null, 0));
console.log(`Written to ${outPath}`);
