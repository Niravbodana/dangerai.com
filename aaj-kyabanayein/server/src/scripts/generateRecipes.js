import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRecipeImage } from "../data/recipeImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../data/generated");

const VEGETABLES = ["Aloo", "Gobi", "Palak", "Bhindi", "Baingan", "Mattar", "Mushroom", "Carrot", "Lauki", "Kaddu", "Methi", "Mooli", "Karela", "Torai", "Corn", "Cabbage", "Capsicum", "Beetroot", "Pumpkin", "Zucchini"];
const VEG_HI = ["आलू", "गोभी", "पालक", "भिंडी", "बैंगन", "मटर", "मशरूम", "गाजर", "लौकी", "कद्दू", "मेथी", "मूली", "करेला", "तोरी", "भुट्टा", "पत्ता गोभी", "शिमला मिर्च", "चुकंदर", "कद्दू", "ज़ुकीनी"];
const STYLES = ["Curry", "Fry", "Sabzi", "Pulao", "Masala", "Tikka", "Korma", "Bharta", "Soup", "Rosted", "Handi", "Jalfrezi", "Do Pyaza", "Tandoori", "Steamed"];
const STYLES_HI = ["करी", "फ्राई", "सब्जी", "पुलाव", "मसाला", "टिक्का", "कोरमा", "भरता", "सूप", "भुना", "हांडी", "जालफ्रेजी", "दो प्याज़ा", "तंदूरी", "स्टीम्ड"];
const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const VARIANTS = ["Home", "Dhaba", "Restaurant", "Traditional", "Quick", "Special", "Classic", "Royal", "Grand", "Lite"];
const REGIONS = ["Punjabi", "Gujarati", "Bengali", "Maharashtrian", "Hyderabadi", "Kashmiri", "Rajasthani", "Awadhi", "Goan", "Chettinad"];
const NONVEG = ["Chicken", "Mutton", "Fish", "Egg", "Prawn", "Lamb", "Duck", "Crab"];
const NONVEG_HI = ["चिकन", "मटन", "मछली", "अंडा", "झींगा", "मेमना", "बतख", "केकड़ा"];

const ITALIAN = ["Pasta", "Pizza", "Risotto", "Lasagna", "Bruschetta", "Gnocchi", "Ravioli", "Carbonara", "Penne", "Margherita"];
const ITALIAN_HI = ["पास्ता", "पिज़्ज़ा", "रिसोट्टो", "लज़ान्या", "ब्रुशेटा", "नियोकी", "रावियोली", "कार्बोनारा", "पेने", "मार्गेरिटा"];
const KOREAN = ["Bibimbap", "Kimchi", "Bulgogi", "Japchae", "Tteokbokki", "Kimbap", "Ramyeon", "Jjigae", "Samgyeopsal", "Dakgalbi"];
const KOREAN_HI = ["बिबिम्बाप", "किमची", "बुल्गोगी", "जापचाए", "ट्टोकबोक्की", "किम्बाप", "रामयन", "ज्जिगाए", "सैमग्योप्सल", "डकगाल्बी"];

function slug(...p) {
  return p.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function makeRecipe(data) {
  const r = { ...data };
  r.image = getRecipeImage(r);
  r.pantryKeys = r.pantryKeys || r.ingredients?.map((i) => i.name.toLowerCase()) || [];
  r.healthScore = r.healthScore ?? 5;
  return r;
}

function generateBatch(prefix, count, builder) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    recipes.push(builder(i));
  }
  return recipes;
}

function writeFile(filename, recipes) {
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(recipes));
  return recipes.length;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

console.log("Generating 1 Lakh recipes...");

const indianVeg = generateBatch("in-v", 40000, (i) => {
  const veg = pick(VEGETABLES, i);
  const vi = VEGETABLES.indexOf(veg);
  const style = pick(STYLES, i >> 2);
  const meal = pick(MEALS, i >> 4);
  return makeRecipe({
    id: slug("in-veg", i), name: `${pick(VARIANTS, i)} ${pick(REGIONS, i)} ${veg} ${style}`,
    nameHi: `${pick(VARIANTS, i)} ${veg} ${pick(STYLES_HI, i >> 2)}`,
    mealType: meal, diet: ["veg", "vegan"], cuisine: "indian", category: `veg-${meal}`,
    budget: "low", cookTime: 20 + (i % 35), calories: 220 + (i % 180), spice: pick(["mild", "medium", "spicy"], i),
    ingredients: [{ name: veg, nameHi: VEG_HI[vi], quantity: "2 cups" }, { name: "Onion", nameHi: "प्याज", quantity: "2" }],
    stepsHi: [`${VEG_HI[vi]} काटें।`, "मसाला बनाएं।", "पकाएं।", "परोसें।"],
    tags: [meal, "veg", "indian"],
  });
});

const indianNonVeg = generateBatch("in-nv", 25000, (i) => {
  const protein = pick(NONVEG, i);
  const pi = NONVEG.indexOf(protein);
  const meal = pick(MEALS, i >> 3);
  return makeRecipe({
    id: slug("in-nv", i), name: `${pick(VARIANTS, i)} ${pick(REGIONS, i)} ${protein} ${pick(STYLES, i)}`,
    nameHi: `${NONVEG_HI[pi]} ${pick(STYLES_HI, i)}`,
    mealType: meal, diet: ["non-veg"], cuisine: "indian", category: `nonveg-${meal}`,
    budget: "medium", cookTime: 30 + (i % 40), calories: 350 + (i % 200), spice: "medium",
    ingredients: [{ name: protein, nameHi: NONVEG_HI[pi], quantity: "500g" }, { name: "Onion", nameHi: "प्याज", quantity: "3" }],
    stepsHi: [`${NONVEG_HI[pi]} मैरिनेट करें।`, "मसाला बनाएं।", "पकाएं।", "परोसें।"],
    tags: [meal, "non-veg", "indian"],
  });
});

const southIndian = generateBatch("si", 15000, (i) => {
  const meal = pick(MEALS, i);
  const isNV = i % 4 === 0;
  return makeRecipe({
    id: slug("si", i), name: `${pick(VARIANTS, i)} South ${pick(STYLES, i)} ${pick(VEGETABLES, i)}`,
    nameHi: `दक्षिण भारतीय ${pick(STYLES_HI, i)}`,
    mealType: meal, diet: isNV ? ["non-veg"] : ["veg", "vegan"], cuisine: "south-indian",
    category: isNV ? `nonveg-${meal}` : `veg-${meal}`,
    budget: "low", cookTime: 25 + (i % 20), calories: 280, spice: "medium",
    ingredients: [{ name: "Rice", nameHi: "चावल", quantity: "1 cup" }],
    stepsHi: ["सामग्री तैयार करें।", "पकाएं।", "परोसें।"],
    tags: [meal, "south-indian"],
  });
});

const italian = generateBatch("it", 10000, (i) => {
  const meal = pick(MEALS, i);
  const isNV = i % 3 === 0;
  return makeRecipe({
    id: slug("it", i), name: `${pick(ITALIAN, i)} ${pick(VARIANTS, i)}`,
    nameHi: `${pick(ITALIAN_HI, i)}`,
    mealType: meal, diet: isNV ? ["non-veg"] : ["veg"], cuisine: "italian",
    category: isNV ? `nonveg-${meal}` : `veg-${meal}`,
    budget: "medium", cookTime: 30 + (i % 15), calories: 400, spice: "mild",
    ingredients: [{ name: pick(ITALIAN, i), nameHi: pick(ITALIAN_HI, i), quantity: "1 serving" }],
    stepsHi: ["तैयार करें।", "पकाएं।", "परोसें।"],
    tags: [meal, "italian"],
  });
});

const korean = generateBatch("it", 10000, (i) => {
  const meal = pick(MEALS, i);
  const isNV = i % 2 === 0;
  return makeRecipe({
    id: slug("kr", i), name: `${pick(KOREAN, i)} ${pick(VARIANTS, i)}`,
    nameHi: `${pick(KOREAN_HI, i)}`,
    mealType: meal, diet: isNV ? ["non-veg"] : ["veg", "vegan"], cuisine: "korean",
    category: isNV ? `nonveg-${meal}` : `veg-${meal}`,
    budget: "medium", cookTime: 25 + (i % 20), calories: 380, spice: "spicy",
    ingredients: [{ name: pick(KOREAN, i), nameHi: pick(KOREAN_HI, i), quantity: "1 serving" }],
    stepsHi: ["तैयार करें।", "पकाएं।", "परोसें।"],
    tags: [meal, "korean"],
  });
});

let total = 0;
total += writeFile("indian-veg.json", indianVeg);
total += writeFile("indian-nonveg.json", indianNonVeg);
total += writeFile("south-indian.json", southIndian);
total += writeFile("italian.json", italian);
total += writeFile("korean.json", korean);

console.log(`Total: ${total} recipes`);

const oldFile = path.join(__dirname, "../data/generatedRecipes.json");
if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
