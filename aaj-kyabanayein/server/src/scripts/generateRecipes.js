import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRecipeImage } from "../data/recipeImages.js";
import { buildIngredients, buildStepsEn, buildStepsHi } from "../data/recipeTemplates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../data/generated");

const VEGETABLES = ["Aloo", "Gobi", "Palak", "Bhindi", "Baingan", "Mattar", "Mushroom", "Carrot", "Lauki", "Kaddu", "Methi", "Mooli", "Karela", "Torai", "Corn", "Cabbage", "Capsicum", "Beetroot", "Pumpkin", "Zucchini", "Drumstick", "Beans", "Cauliflower", "Spinach", "Radish"];
const VEG_HI = ["आलू", "गोभी", "पालक", "भिंडी", "बैंगन", "मटर", "मशरूम", "गाजर", "लौकी", "कद्दू", "मेथी", "मूली", "करेला", "तोरी", "भुट्टा", "पत्ता गोभी", "शिमला मिर्च", "चुकंदर", "कद्दू", "ज़ुकीनी", "सहजन", "बीन्स", "फूलगोभी", "पालक", "मूली"];
const STYLES = ["Curry", "Fry", "Sabzi", "Pulao", "Masala", "Tikka", "Korma", "Bharta", "Soup", "Rosted", "Handi", "Jalfrezi", "Do Pyaza", "Tandoori", "Steamed", "Gravy", "Dry", "Raita", "Paratha", "Khichdi"];
const STYLES_HI = ["करी", "फ्राई", "सब्जी", "पुलाव", "मसाला", "टिक्का", "कोरमा", "भरता", "सूप", "भुना", "हांडी", "जालफ्रेजी", "दो प्याज़ा", "तंदूरी", "स्टीम्ड", "ग्रेवी", "सूखी", "रायता", "पराठा", "खिचड़ी"];
const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const VARIANTS = ["Home", "Dhaba", "Restaurant", "Traditional", "Quick", "Special", "Classic", "Royal", "Grand", "Lite", "Authentic", "Street", "Festive", "Comfort"];
const REGIONS = ["Punjabi", "Gujarati", "Bengali", "Maharashtrian", "Hyderabadi", "Kashmiri", "Rajasthani", "Awadhi", "Goan", "Chettinad", "Mughlai", "Sindhi", "Odia", "Assamese"];
const NONVEG = ["Chicken", "Mutton", "Fish", "Egg", "Prawn", "Lamb", "Duck", "Crab", "Keema", "Pork"];
const NONVEG_HI = ["चिकन", "मटन", "मछली", "अंडा", "झींगा", "मेमना", "बतख", "केकड़ा", "कीमा", "पोर्क"];

const ITALIAN = ["Pasta", "Pizza", "Risotto", "Lasagna", "Bruschetta", "Gnocchi", "Ravioli", "Carbonara", "Penne", "Margherita", "Focaccia", "Risotto", "Tiramisu"];
const ITALIAN_HI = ["पास्ता", "पिज़्ज़ा", "रिसोट्टो", "लज़ान्या", "ब्रुशेटा", "नियोकी", "रावियोली", "कार्बोनारा", "पेने", "मार्गेरिटा", "फोकाचिया", "रिसोट्टो", "तिरामिसु"];
const KOREAN = ["Bibimbap", "Kimchi", "Bulgogi", "Japchae", "Tteokbokki", "Kimbap", "Ramyeon", "Jjigae", "Samgyeopsal", "Dakgalbi", "Banchan", "Hotteok"];
const KOREAN_HI = ["बिबिम्बाप", "किमची", "बुल्गोगी", "जापचाए", "ट्टोकबोक्की", "किम्बाप", "रामयन", "ज्जिगाए", "सैमग्योप्सल", "डकगाल्बी", "बांचान", "होत्तोक"];
const CHINESE = ["Fried Rice", "Noodles", "Manchurian", "Dim Sum", "Kung Pao", "Spring Roll", "Hot Pot", "Wonton", "Chow Mein", "Mapo Tofu", "Dumpling"];
const CHINESE_HI = ["फ्राइड राइस", "नूडल्स", "मंचूरियन", "डिम सम", "कुंग पाओ", "स्प्रिंग रोल", "हॉट पॉट", "वॉन्टन", "चाउ मीन", "मापो टोफू", "डम्पलिंग"];
const THAI = ["Pad Thai", "Green Curry", "Tom Yum", "Massaman", "Som Tam", "Panang", "Satay", "Basil Rice", "Mango Sticky Rice", "Tom Kha"];
const THAI_HI = ["पैड थाई", "ग्रीन करी", "टॉम यम", "मसमन", "सोम टैम", "पनांग", "सटे", "बेसिल राइस", "मैंगो स्टिकी राइस", "टॉम खा"];
const MEXICAN = ["Tacos", "Burrito", "Quesadilla", "Enchilada", "Nachos", "Guacamole", "Fajita", "Tamale", "Churros", "Salsa Bowl"];
const MEXICAN_HI = ["टैकोस", "बरिटो", "क्वेसाडिला", "एनचिलाडा", "नाचोस", "गुआकामोले", "फजीता", "टमाले", "चुरोस", "साल्सा बाउल"];
const CONTINENTAL = ["Grilled Sandwich", "Caesar Salad", "Soup Bowl", "Steak Plate", "Pasta Bake", "Quiche", "Croissant", "Wrap", "Burger Bowl", "Garlic Bread"];
const CONTINENTAL_HI = ["ग्रिल्ड सैंडविच", "सीज़र सलाद", "सूप बाउल", "स्टेक प्लेट", "पास्ता बेक", "किश", "क्रोइसां", "रैप", "बर्गर बाउल", "गार्लिक ब्रेड"];
const HEALTHY = ["Salad Bowl", "Smoothie Bowl", "Grilled Veg", "Steamed Bowl", "Protein Bowl", "Oats Bowl", "Quinoa Bowl", "Detox Soup", "Fruit Bowl", "Sprout Bowl"];
const HEALTHY_HI = ["सलाद बाउल", "स्मूदी बाउल", "ग्रिल्ड वेज", "स्टीम्ड बाउल", "प्रोटीन बाउल", "ओट्स बाउल", "कीनोआ बाउल", "डिटॉक्स सूप", "फ्रूट बाउल", "अंकुरित बाउल"];

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
  r.healthScore = r.healthScore ?? (data.cuisine === "healthy" ? 9 : 5);
  return r;
}

function writeBatch(filename, recipes) {
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(recipes));
  return recipes.length;
}

function generateIndianVeg(count, prefix) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    const veg = pick(VEGETABLES, i);
    const vi = VEGETABLES.indexOf(veg);
    const style = pick(STYLES, i >> 1);
    const styleHi = pick(STYLES_HI, i >> 1);
    const meal = pick(MEALS, i >> 3);
    const mainIng = { name: veg, nameHi: VEG_HI[vi], quantity: "2 cups" };
    const ingredients = buildIngredients(mainIng, style, false);
    const name = `${veg} ${style}`;
    recipes.push(makeRecipe({
      id: slug(prefix, i),
      name,
      nameHi: `${VEG_HI[vi]} ${styleHi}`,
      mealType: meal,
      diet: i % 5 === 0 ? ["veg", "vegan"] : ["veg"],
      cuisine: "indian",
      category: `veg-${meal}`,
      budget: pick(["low", "medium"], i),
      cookTime: 15 + (i % 45),
      calories: 200 + (i % 220),
      spice: pick(["mild", "medium", "spicy"], i),
      ingredients,
      steps: buildStepsEn(veg, style, false),
      stepsHi: buildStepsHi(VEG_HI[vi], styleHi),
      tags: [meal, "veg", "indian"],
    }));
  }
  return recipes;
}

function generateIndianNonVeg(count, prefix) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    const protein = pick(NONVEG, i);
    const pi = NONVEG.indexOf(protein);
    const style = pick(STYLES, i);
    const styleHi = pick(STYLES_HI, i);
    const meal = pick(MEALS, i >> 2);
    const mainIng = { name: protein, nameHi: NONVEG_HI[pi], quantity: "500g" };
    const ingredients = buildIngredients(mainIng, style, true);
    const name = `${protein} ${style}`;
    recipes.push(makeRecipe({
      id: slug(prefix, i),
      name,
      nameHi: `${NONVEG_HI[pi]} ${styleHi}`,
      mealType: meal,
      diet: ["non-veg"],
      cuisine: "indian",
      category: `nonveg-${meal}`,
      budget: pick(["medium", "high"], i),
      cookTime: 25 + (i % 50),
      calories: 320 + (i % 280),
      spice: pick(["mild", "medium", "spicy"], i),
      ingredients,
      steps: buildStepsEn(protein, style, true),
      stepsHi: buildStepsHi(NONVEG_HI[pi], styleHi),
      tags: [meal, "non-veg", "indian"],
    }));
  }
  return recipes;
}

function generateRegional(count, prefix, cuisine, nameArr, nameHiArr, vegRatio = 3) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    const meal = pick(MEALS, i);
    const isNV = i % vegRatio === 0;
    const dish = pick(nameArr, i);
    const dishHi = pick(nameHiArr, i);
    const style = pick(STYLES, i >> 2);
    const styleHi = pick(STYLES_HI, i >> 2);
    const mainIng = { name: dish, nameHi: dishHi, quantity: isNV ? "500g" : "2 cups" };
    const ingredients = buildIngredients(mainIng, style, isNV);
    const name = `${dish} ${style}`;
    recipes.push(makeRecipe({
      id: slug(prefix, i),
      name,
      nameHi: `${dishHi} ${styleHi}`,
      mealType: meal,
      diet: isNV ? ["non-veg"] : ["veg", "vegan"],
      cuisine,
      category: isNV ? `nonveg-${meal}` : `veg-${meal}`,
      budget: pick(["low", "medium", "high"], i),
      cookTime: 20 + (i % 35),
      calories: 280 + (i % 200),
      spice: pick(["mild", "medium", "spicy"], i),
      ingredients,
      steps: buildStepsEn(dish, style, isNV),
      stepsHi: buildStepsHi(dishHi, styleHi),
      tags: [meal, cuisine],
    }));
  }
  return recipes;
}

function generateHealthy(count, prefix) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    const meal = pick(MEALS, i);
    const dish = pick(HEALTHY, i);
    const dishHi = pick(HEALTHY_HI, i);
    const mainIng = { name: dish, nameHi: dishHi, quantity: "1 bowl" };
    const ingredients = [
      mainIng,
      { name: "Olive oil", nameHi: "जैतून का तेल", quantity: "1 tbsp" },
      { name: "Lemon juice", nameHi: "नींबू", quantity: "1 tbsp" },
      { name: "Mixed seeds", nameHi: "मिक्स बीज", quantity: "2 tbsp" },
      { name: "Salt", nameHi: "नमक", quantity: "to taste" },
      { name: "Black pepper", nameHi: "काली मिर्च", quantity: "1/4 tsp" },
    ];
    recipes.push(makeRecipe({
      id: slug(prefix, i),
      name: dish,
      nameHi: dishHi,
      mealType: meal,
      diet: ["veg", "vegan"],
      cuisine: "healthy",
      category: "healthy",
      budget: "low",
      cookTime: 10 + (i % 25),
      calories: 150 + (i % 150),
      spice: "mild",
      ingredients,
      steps: [
        "Gather fresh ingredients.",
        "Wash and prep vegetables or fruits.",
        "Combine in a bowl with light seasoning.",
        "Drizzle olive oil and lemon.",
        "Serve fresh immediately.",
      ],
      stepsHi: [
        "ताज़ी सामग्री तैयार करें।",
        "सब्जी या फल धोकर काटें।",
        "कटोरे में हल्के मसाले मिलाएं।",
        "जैतून का तेल और नींबू डालें।",
        "तुरंत ताज़ा परोसें।",
      ],
      tags: ["healthy", meal],
    }));
  }
  return recipes;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const BATCHES = [
  { file: "indian-veg.json", fn: () => generateIndianVeg(120000, "in-veg") },
  { file: "indian-nonveg.json", fn: () => generateIndianNonVeg(80000, "in-nv") },
  { file: "south-indian.json", fn: () => generateRegional(60000, "si", "south-indian", STYLES, STYLES_HI, 4) },
  { file: "north-indian.json", fn: () => generateRegional(50000, "ni", "north-indian", REGIONS, REGIONS, 5) },
  { file: "chinese.json", fn: () => generateRegional(50000, "cn", "chinese", CHINESE, CHINESE_HI, 3) },
  { file: "italian.json", fn: () => generateRegional(40000, "it", "italian", ITALIAN, ITALIAN_HI, 3) },
  { file: "korean.json", fn: () => generateRegional(40000, "kr", "korean", KOREAN, KOREAN_HI, 2) },
  { file: "thai.json", fn: () => generateRegional(30000, "th", "thai", THAI, THAI_HI, 3) },
  { file: "mexican.json", fn: () => generateRegional(30000, "mx", "mexican", MEXICAN, MEXICAN_HI, 4) },
  { file: "continental.json", fn: () => generateRegional(25000, "ct", "continental", CONTINENTAL, CONTINENTAL_HI, 3) },
  { file: "healthy.json", fn: () => generateHealthy(45000, "hl") },
];

console.log("Generating 5.7 Lakh recipes across categories...");

let total = 0;
for (const batch of BATCHES) {
  const start = Date.now();
  const recipes = batch.fn();
  const n = writeBatch(batch.file, recipes);
  total += n;
  console.log(`  ${batch.file}: ${n.toLocaleString()} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
}

console.log(`\nTotal: ${total.toLocaleString()} recipes`);

// Build lightweight index for fast server startup
console.log("Building recipe index...");
const index = [];
for (const batch of BATCHES) {
  const recipes = JSON.parse(fs.readFileSync(path.join(OUT_DIR, batch.file), "utf-8"));
  for (const r of recipes) {
    index.push({
      id: r.id,
      name: r.name,
      nameHi: r.nameHi,
      mealType: r.mealType,
      diet: r.diet,
      cuisine: r.cuisine || "indian",
      category: r.category,
      budget: r.budget,
      cookTime: r.cookTime,
      calories: r.calories,
      spice: r.spice,
      tags: r.tags,
      shard: batch.file,
    });
  }
}
fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index));
console.log(`Index: ${index.length.toLocaleString()} entries`);

const oldFile = path.join(__dirname, "../data/generatedRecipes.json");
if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
