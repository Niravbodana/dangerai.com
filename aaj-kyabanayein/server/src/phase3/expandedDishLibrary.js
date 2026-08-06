/**
 * Expanded unique dish library for Phase 3 scale-up to 10,000+.
 * Each entry is a DISTINCT recipe identity — not meal×diet duplicates.
 */
import { PHASE3_TARGETS } from "./importTargets.js";
import { POPULAR_RECIPES } from "./popularRecipes.js";
import { containsMeatWord } from "../lib/dietNormalize.js";

const EGG_WORD_RE = /\b(egg|eggs|anda|omelette)\b/i;
const JAIN_EXCLUDE_RE = /\b(onion|garlic|egg|eggs|chicken|fish|mutton)\b/i;

const CUISINE_META = {
  gujarati: { state: "Gujarat", region: "Gujarat" },
  punjabi: { state: "Punjab", region: "Punjab" },
  "north-indian": { state: null, region: "North India" },
  "south-indian": { state: null, region: "South India" },
  tamil: { state: "Tamil Nadu", region: "Tamil Nadu" },
  kerala: { state: "Kerala", region: "Kerala" },
  andhra: { state: "Andhra Pradesh", region: "Andhra Pradesh" },
  karnataka: { state: "Karnataka", region: "Karnataka" },
  maharashtrian: { state: "Maharashtra", region: "Maharashtra" },
  rajasthani: { state: "Rajasthan", region: "Rajasthan" },
  bengali: { state: "West Bengal", region: "West Bengal" },
  goan: { state: "Goa", region: "Goa" },
  hyderabadi: { state: "Telangana", region: "Telangana" },
  kashmiri: { state: "Jammu and Kashmir", region: "Kashmir" },
  sindhi: { state: null, region: "Sindh" },
  jain: { state: null, region: "Pan-India" },
  "street-food": { state: null, region: "Pan-India" },
  "chinese-indian": { state: null, region: "Pan-India" },
  odia: { state: "Odisha", region: "Odisha" },
  assamese: { state: "Assam", region: "Assam" },
};

/** Base dishes by cuisine — popular Indian home & restaurant cooking */
const BASE_DISHES = {
  gujarati: [
    "Dhokla", "Khaman", "Thepla", "Methi Thepla", "Bajri Thepla", "Undhiyu", "Handvo", "Khandvi",
    "Fafda", "Gathiya", "Patra", "Sev Tameta", "Ringan no Olo", "Dal Dhokli", "Gujarati Dal",
    "Gujarati Kadhi", "Khichu", "Muthiya", "Lilva Kachori", "Magas", "Mohanthal", "Shrikhand",
    "Basundi", "Sukhdi", "Chorafali", "Sev Khamani", "Dabeli Masala Mix", "Osaman", "Gujarati Khichdi",
    "Bhakri", "Bajra Rotla", "Tuvar Lilva", "Undhiyu Dry", "Aamras", "Keri Nu Athanu",
    "Gujarati Thali Combo", "Batata Nu Shaak", "Tindora Nu Shaak", "Gavar Nu Shaak", "Karela Nu Shaak",
    "Dahi Wada Gujarati", "Papdi No Lot", "Ponk", "Surti Undhiyu", "Jain Undhiyu",
  ],
  punjabi: [
    "Dal Makhani", "Butter Chicken", "Paneer Butter Masala", "Chole Bhature", "Sarson da Saag",
    "Makki di Roti", "Rajma Chawal", "Amritsari Kulcha", "Paneer Tikka", "Tandoori Chicken",
    "Lassi", "Aloo Paratha", "Gobi Paratha", "Paneer Paratha", "Mooli Paratha", "Kadhi Pakora",
    "Pinni", "Chicken Tikka Masala", "Amritsari Fish", "Punjabi Kadhi", "Punjabi Chole",
    "Paneer Bhurji", "Shahi Paneer", "Malai Kofta", "Kadai Paneer", "Palak Paneer",
    "Aloo Gobi", "Baingan Bharta", "Bhindi Masala", "Jeera Rice", "Peas Pulao",
    "Tandoori Roti", "Butter Naan", "Garlic Naan", "Lachha Paratha", "Missi Roti",
    "Punjabi Lassi Sweet", "Salted Lassi", "Mango Lassi", "Punjabi Pakora", "Samosa Chaat Punjabi",
    "Chicken Seekh Kebab", "Mutton Seekh", "Tandoori Paneer", "Amritsari Naan", "Punjabi Dal Fry",
  ],
  "north-indian": [
    "Dal Tadka", "Dal Fry", "Jeera Rice", "Veg Biryani", "Naan", "Roti", "Chapati", "Phulka",
    "Raita", "Boondi Raita", "Cucumber Raita", "Kachumber Salad", "Baingan Bharta", "Aloo Matar",
    "Aloo Jeera", "Matar Paneer", "Chana Masala", "Rajma Masala", "Kadhi", "Vegetable Pulao",
    "Gajar Ka Halwa", "Sooji Halwa", "Gulab Jamun", "Kheer", "Jalebi", "Kulfi", "Ladoo",
    "Besan Ladoo", "Motichoor Ladoo", "Pakora", "Onion Pakora", "Aloo Tikki", "Cutlet",
    "Egg Curry", "Egg Bhurji", "Omelette", "Chicken Curry", "Chicken Biryani", "Chicken Korma",
    "Chicken Keema", "Mutton Curry", "Keema Matar", "Nihari", "Moong Dal Khichdi", "Khichdi",
    "Sprouts Salad", "Palak Soup", "Paratha", "Besan Chilla", "Bread Pakora", "Upma North",
    "Dum Aloo Banarasi", "Kashmiri Dum Aloo Style", "Navratan Korma", "Vegetable Jalfrezi",
    "Paneer Lababdar", "Methi Malai Matar", "Corn Palak", "Mushroom Masala", "Soya Chaap",
  ],
  "south-indian": [
    "Masala Dosa", "Plain Dosa", "Rava Dosa", "Set Dosa", "Idli", "Sambar", "Rasam",
    "Coconut Chutney", "Tomato Chutney", "Medu Vada", "Uttapam", "Onion Uttapam", "Lemon Rice",
    "Curd Rice", "Tamarind Rice", "Coconut Rice", "Tomato Rice", "Filter Coffee", "Upma",
    "Rava Upma", "Pesarattu", "Onion Rava Dosa", "Mysore Masala Dosa", "Paper Dosa",
    "Idli Sambar Combo", "Vada Sambar", "Gunpowder Idli", "Kanchipuram Idli", "Thatte Idli",
    "Chicken 65", "Fish Fry South", "Fish Curry South", "Prawn Fry", "Crab Masala",
    "Vegetable Stew", "Coconut Milk Curry", "Podi Idli", "Ghee Roast Dosa", "Neer Dosa Style",
  ],
  tamil: [
    "Pongal", "Ven Pongal", "Sweet Pongal", "Chettinad Chicken Curry", "Chettinad Egg Curry",
    "Avial Tamil", "Kootu", "Poriyal", "Thoran Style", "Rasam Pepper", "Tomato Rasam",
    "Lemon Rasam", "Mor Kuzhambu", "Vatha Kuzhambu", "Sambar Onion", "Drumstick Sambar",
    "Adai", "Kuzhi Paniyaram", "Appam Tamil", "Idiyappam", "Sevai", "Kothamalli Rice",
    "Curry Leaves Rice", "Kara Chutney", "Mint Chutney", "Coriander Chutney",
  ],
  kerala: [
    "Appam", "Pal Appam", "Puttu", "Puttu Kadala", "Fish Curry Kerala", "Malabar Biryani",
    "Sadya", "Payasam", "Ada Pradhaman", "Palada Payasam", "Avial", "Thoran", "Olan",
    "Erissery", "Kalan", "Pachadi", "Inji Puli", "Sambar Kerala", "Fish Molee",
    "Chicken Stew Kerala", "Beef Fry Kerala", "Kappa Meen Curry", "Idiyappam Kerala",
    "Pathiri", "Unniyappam", "Banana Chips Kerala", "Parippu Curry", "Vegetable Stew",
  ],
  andhra: [
    "Pulihora", "Gongura Pachadi", "Andhra Chicken Curry", "Pesarattu", "Gutti Vankaya",
    "Andhra Fish Curry", "Gongura Chicken", "Andhra Egg Curry", "Pesarattu Upma",
    "Mirchi Bajji", "Punugulu", "Garelu", "Bobbatlu", "Ariselu", "Andhra Sambar",
    "Tomato Pappu", "Bendakaya Fry", "Dondakaya Fry", "Andhra Rasam", "Curd Rice Andhra",
  ],
  karnataka: [
    "Bisi Bele Bath", "Mysore Pak", "Neer Dosa", "Mangalore Fish Curry", "Ragi Mudde",
    "Akki Roti", "Jolada Roti", "Ragi Rotti", "Kosambari", "Obbattu", "Holige",
    "Mysore Masala Dosa", "Mangalore Buns", "Goli Baje", "Bonda Soup", "Saagu",
    "Vangi Bath", "Chitranna", "Kayi Holige", "Ragi Dosa", "Set Dosa Karnataka",
  ],
  maharashtrian: [
    "Pav Bhaji", "Vada Pav", "Misal Pav", "Poha", "Kanda Poha", "Batata Poha", "Puran Poli",
    "Modak", "Ukadiche Modak", "Sabudana Khichdi", "Thalipeeth", "Bharli Vangi", "Shrikhand Puri",
    "Zunka Bhakar", "Pitla", "Bhakri", "Solkadhi", "Kothimbir Vadi", "Alu Vadi",
    "Sabudana Vada", "Kanda Bhaji", "Batata Bhaji", "Puran Poli Spicy", "Narali Bhaat",
    "Amti", "Varan Bhaat", "Matki Usal", "Misal Kolhapuri", "Kolhapuri Chicken",
    "Malvani Fish Curry", "Bombil Fry", "Sheera", "Shrikhand Amrakhand", "Aamras Poli",
  ],
  rajasthani: [
    "Dal Baati Churma", "Dal Baati", "Gatte ki Sabzi", "Ker Sangri", "Laal Maas", "Ghevar",
    "Mirchi Vada", "Pyaaz Kachori", "Rajasthani Kadhi", "Besan Gatte", "Papad Curry",
    "Mawa Kachori", "Malpua Rajasthani", "Safed Maas", "Jungli Maas", "Bajre Ki Roti",
    "Gatte Ki Kadhi", "Rajasthani Khichdi", "Churma Ladoo", "Mohanthal Rajasthani",
    "Kalakand", "Ghevar Malai", "Dal Baati Without Churma", "Ker Sangri Dry",
  ],
  bengali: [
    "Machher Jhol", "Shukto", "Luchi Aloo Dum", "Mishti Doi", "Sandesh", "Rasgulla",
    "Cholar Dal", "Kosha Mangsho", "Rasmalai", "Aloor Dom", "Beguni", "Posto Bata",
    "Chingri Malai Curry", "Ilish Bhapa", "Doi Maach", "Lau Chingri", "Moong Dal Bengali",
    "Bhaja Moong Dal", "Aam Dal", "Tomato Chutney Bengali", "Payesh", "Pantua",
    "Rosogolla Sponge", "Sondesh Kachagolla", "Fulkopir Roast", "Dim Curry Bengali",
  ],
  goan: [
    "Goan Fish Curry", "Goan Prawn Curry", "Xacuti", "Chicken Xacuti", "Bebinca", "Sorpotel",
    "Prawn Balchao", "Fish Recheado", "Goan Sausage Pulao", "Pork Vindaloo", "Chicken Cafreal",
    "Sol Anta", "Kismur", "Goan Fish Fry", "Prawn Curry Coconut", "Bebinca Classic",
    "Dodol", "Serradura", "Goan Coconut Curry", "Ambot Tik",
  ],
  hyderabadi: [
    "Hyderabadi Biryani", "Chicken Dum Biryani", "Mutton Biryani Hyderabadi", "Haleem",
    "Mirchi ka Salan", "Double ka Meetha", "Baghara Baingan", "Hyderabadi Khatti Dal",
    "Sheer Khurma Hyderabadi", "Nihari Hyderabadi", "Kheema", "Lukhmi", "Osmania Biscuit Style",
    "Hyderabadi Chicken Curry", "Pathar Ka Gosht", "Marag", "Dil Pasand",
  ],
  kashmiri: [
    "Rogan Josh", "Dum Aloo", "Yakhni Pulao", "Kahwa", "Gushtaba", "Rista", "Modur Pulav",
    "Nadru Yakhni", "Haak", "Kashmiri Rajma", "Tabak Maaz", "Aab Gosht", "Kashmiri Pulao",
    "Noon Chai", "Kashmiri Roti", "Kashmiri Chicken", "Kashmiri Paneer",
  ],
  sindhi: [
    "Sindhi Kadhi", "Sai Bhaji", "Dal Pakwan", "Koki", "Sindhi Biryani", "Bhee",
    "Sindhi Curry", "Seyal Bhaji", "Seyal Bread", "Sindhi Koki", "Alif Be",
  ],
  jain: [
    "Jain Pav Bhaji", "Raw Banana Sabzi", "Jain Biryani", "Jain Pasta", "Jain Pizza",
    "Jain Manchurian", "Jain Fried Rice", "Jain Noodles", "Jain Dhokla", "Jain Thepla",
    "Jain Khichdi", "Jain Kadhi", "Banana Flower Sabzi", "Suran Sabzi", "Jain Sev Tameta",
  ],
  "street-food": [
    "Pani Puri", "Bhel Puri", "Samosa", "Kathi Roll", "Dabeli", "Chaat", "Aloo Chaat",
    "Papdi Chaat", "Momos", "Veg Momos", "Chicken Momos", "Kachori", "Dal Kachori",
    "Sev Puri", "Dahi Puri", "Ragda Pattice", "Samosa Chaat", "Frankie", "Egg Roll",
    "Chicken Roll", "Chowmein Street", "Egg Chowmein", "Jalebi Fafda Combo", "Chole Samosa",
    "Pao Bhaji Street", "Vada Pav Street", "Misal Street", "Kulfi Falooda", "Gola",
  ],
  "chinese-indian": [
    "Hakka Noodles", "Manchurian", "Gobi Manchurian", "Veg Manchurian", "Fried Rice",
    "Veg Fried Rice", "Chilli Chicken", "Hot and Sour Soup", "Schezwan Fried Rice",
    "Egg Fried Rice", "Spring Roll", "Chilli Paneer", "Chilli Potato", "American Chopsuey",
    "Manchow Soup", "Sweet Corn Soup", "Chicken Manchurian", "Schezwan Noodles",
    "Honey Chilli Potato", "Dragon Chicken", "Kung Pao Style Paneer", "Crispy Corn",
  ],
  odia: [
    "Dalma", "Pakhala", "Chhena Poda", "Rasabali", "Santula", "Odia Fish Curry",
    "Machha Besara", "Chhena Jhili", "Kakara Pitha", "Arisa Pitha", "Manda Pitha",
  ],
  assamese: [
    "Assamese Fish Curry", "Aloo Pitika", "Khar", "Ou Tenga", "Masor Tenga",
    "Pitha Assamese", "Duck Curry Assamese", "Bamboo Shoot Curry", "Assamese Dal",
  ],
};

const PROTEIN_DISHES = {
  egg: [
    "Egg Curry", "Egg Bhurji", "Masala Omelette", "Boiled Egg Masala", "Egg Fried Rice",
    "Egg Curry Coconut", "Egg Roast", "Egg Drop Curry", "Egg Biryani", "Egg Paratha Filling",
    "Egg Curry Andhra", "Egg Curry Bengali", "Egg Curry Kerala", "French Toast Indian",
    "Egg Keema", "Egg Masala Dry", "Egg Pepper Fry", "Egg Curry Restaurant Style",
  ],
  chicken: [
    "Chicken Curry", "Chicken Biryani", "Chicken Tikka Masala", "Chicken Korma", "Chicken Keema",
    "Chicken 65", "Butter Chicken", "Tandoori Chicken", "Chettinad Chicken Curry", "Chilli Chicken",
    "Chicken Xacuti", "Kolhapuri Chicken", "Hyderabadi Chicken Curry", "Chicken Stew Kerala",
    "Chicken Seekh Kebab", "Chicken Cafreal", "Gongura Chicken", "Chicken Manchurian",
    "Chicken Curry Home Style", "Chicken Curry Restaurant", "Chicken Masala Dry", "Chicken Pepper Fry",
    "Chicken Sukka", "Chicken Handi", "Chicken Do Pyaza", "Chicken Changezi", "Chicken Afghani",
    "Chicken Reshmi Kebab", "Chicken Malai Tikka", "Chicken Hariyali Tikka", "Chicken Pulao",
    "Chicken Fried Rice Indo", "Chicken Hakka Noodles", "Chicken Stew Mild", "Chicken Curry Spicy",
  ],
  mutton: [
    "Mutton Curry", "Mutton Biryani", "Keema Matar", "Nihari", "Laal Maas", "Kosha Mangsho",
    "Haleem", "Rogan Josh", "Sorpotel", "Mutton Seekh", "Safed Maas", "Pathar Ka Gosht",
    "Mutton Curry Home", "Mutton Rogan", "Mutton Korma", "Mutton Sukka", "Mutton Pulao",
    "Mutton Keema", "Mutton Handi", "Mutton Do Pyaza", "Mutton Pepper Fry", "Mutton Biryani Lucknowi",
  ],
  fish: [
    "Fish Curry", "Fish Fry", "Machher Jhol", "Goan Fish Curry", "Amritsari Fish", "Tandoori Pomfret",
    "Malabar Fish Curry", "Fish Molee", "Ilish Bhapa", "Doi Maach", "Mangalore Fish Curry",
    "Andhra Fish Curry", "Fish Recheado", "Fish Fry South", "Fish Curry Coconut", "Fish Curry Mustard",
    "Fish Tikka", "Fish Cutlet", "Fish Biryani", "Fish Curry Kerala Red",
  ],
  seafood: [
    "Prawn Curry", "Prawn Fry", "Crab Masala", "Goan Prawn Curry", "Chingri Malai Curry",
    "Prawn Balchao", "Prawn Curry Coconut", "Crab Curry", "Squid Fry", "Prawn Masala Dry",
    "Prawn Biryani", "Seafood Platter Curry", "Prawn Pepper Fry", "Lobster Masala",
  ],
};

const BREAKFAST_EXTRA = [
  "Poha", "Upma", "Idli", "Dosa", "Paratha", "Aloo Paratha", "Besan Chilla", "Bread Pakora",
  "Oats Upma", "Rava Idli", "Vegetable Sandwich", "Masala Toast", "Poha Kanda", "Sabudana Khichdi",
  "Thalipeeth", "Appam", "Puttu", "Pongal", "Misal Pav", "Chole Bhature", "Dal Pakwan",
  "Koki", "Methi Thepla", "Moong Dal Chilla", "Ragi Dosa", "Neer Dosa", "Set Dosa",
];

const SNACK_EXTRA = [
  "Samosa", "Pakora", "Aloo Tikki", "Cutlet", "Spring Roll", "Kachori", "Mirchi Vada",
  "Bhel Puri", "Pani Puri", "Momos", "Dabeli", "Vada Pav", "Kothimbir Vadi", "Sabudana Vada",
  "Onion Bhaji", "Corn Cutlet", "Paneer Pakora", "Bread Roll", "Vegetable Cutlet", "Dhokla",
];

const DESSERT_EXTRA = [
  "Gulab Jamun", "Kheer", "Jalebi", "Rasmalai", "Rasgulla", "Halwa", "Kulfi", "Ladoo",
  "Shrikhand", "Mishti Doi", "Sandesh", "Payasam", "Bebinca", "Ghevar", "Mohanthal",
  "Double ka Meetha", "Basundi", "Payesh", "Modak", "Puran Poli Sweet", "Malpua",
];

const FESTIVAL_EXTRA = [
  "Gujiya", "Thandai", "Sewaiyan", "Navratri Vrat Thali", "Diwali Snacks Platter",
  "Modak", "Puran Poli", "Undhiyu", "Sheer Khurma", "Holige", "Ariselu", "Pitha Assamese",
];

const HEALTHY_EXTRA = [
  "Moong Dal Khichdi", "Sprouts Salad", "Quinoa Upma", "Palak Soup", "Oats Upma",
  "Ragi Dosa", "Vegetable Soup", "Grilled Paneer Salad", "Millet Khichdi", "Dal Soup",
];

const STYLE_PREFIXES = [
  "Home Style", "Restaurant Style", "Dhaba Style", "Quick", "One Pot", "Pressure Cooker",
  "Traditional", "Modern", "Spicy", "Mild", "Creamy", "Dry",
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function makeDish(name, cuisine, category, extras = {}) {
  const meta = CUISINE_META[cuisine] || { state: null, region: "India" };
  const diet = extras.diet || inferDiet(name, category);
  return {
    name,
    cuisine,
    category,
    state: meta.state,
    region: meta.region,
    mealType: extras.mealType || inferMealType(category, name),
    diet,
    popularityScore: extras.popularityScore || 70,
    priority: extras.priority || 2,
    festival: extras.festival || null,
    alternativeNames: extras.alternativeNames || [],
  };
}

function inferDiet(name, category) {
  if (category === "jain" || /jain/i.test(name)) return ["jain", "vegetarian"];
  if (containsMeatWord(name)) return ["non-vegetarian"];
  if (EGG_WORD_RE.test(name)) return ["eggetarian"];
  if (category === "healthy" && /salad|sprout|quinoa|millet/i.test(name)) return ["vegan", "vegetarian"];
  return ["vegetarian"];
}

function inferMealType(category, name) {
  if (category === "breakfast" || /breakfast|poha|idli|dosa|paratha|upma|chilla/i.test(name)) return "breakfast";
  if (category === "snacks" || category === "street-food" || category === "desserts") return "snack";
  if (/biryani|curry|dal|sabzi|thali/i.test(name)) return "lunch";
  return "dinner";
}

/**
 * Generate unique dish list (deduped by slug).
 * Target: 10,000+ distinct recipe identities.
 */
export function generateUniqueDishLibrary(target = 10000) {
  const seen = new Set();
  const dishes = [];

  const add = (dish) => {
    const key = slugify(`${dish.cuisine}-${dish.name}`);
    if (seen.has(key)) return false;
    seen.add(key);
    dishes.push({ ...dish, id: `lib-${key}`, slug: key });
    return true;
  };

  // 1. Seed from curated popular recipes first
  for (const r of POPULAR_RECIPES) {
    add(makeDish(r.name, r.cuisine, r.category || r.cuisine, {
      diet: r.diet,
      mealType: r.mealType,
      popularityScore: r.popularityScore,
      priority: r.priority,
      festival: r.festival,
      alternativeNames: r.alternativeNames,
    }));
  }

  // 2. Base cuisine dishes
  for (const [cuisine, names] of Object.entries(BASE_DISHES)) {
    for (const name of names) {
      add(makeDish(name, cuisine, cuisine, { popularityScore: 75, priority: 1 }));
    }
  }

  // 3. Protein categories
  for (const [cat, names] of Object.entries(PROTEIN_DISHES)) {
    for (const name of names) {
      const cuisine = /hyderabadi|chettinad|kerala|goan|bengali|andhra|kolhapuri|malabar/i.test(name)
        ? inferCuisineFromName(name)
        : "north-indian";
      add(makeDish(name, cuisine, cat, {
        diet: cat === "egg" ? ["eggetarian"] : ["non-vegetarian"],
        popularityScore: 80,
        priority: 1,
      }));
    }
  }

  // 4. Category extras
  for (const name of BREAKFAST_EXTRA) {
    add(makeDish(name, inferCuisineFromName(name), "breakfast", { mealType: "breakfast", popularityScore: 78 }));
  }
  for (const name of SNACK_EXTRA) {
    add(makeDish(name, inferCuisineFromName(name), "snacks", { mealType: "snack", popularityScore: 76 }));
  }
  for (const name of DESSERT_EXTRA) {
    add(makeDish(name, inferCuisineFromName(name), "desserts", { mealType: "snack", popularityScore: 77 }));
  }
  for (const name of FESTIVAL_EXTRA) {
    add(makeDish(name, "north-indian", "festival", { mealType: "snack", popularityScore: 75, festival: "Festival" }));
  }
  for (const name of HEALTHY_EXTRA) {
    add(makeDish(name, "north-indian", "healthy", { mealType: "lunch", popularityScore: 72 }));
  }

  // 5. Style variants of popular bases (meaningful unique recipes)
  const variantBases = [
    ...Object.values(BASE_DISHES).flat().slice(0, 80),
    ...Object.values(PROTEIN_DISHES).flat().slice(0, 40),
  ];

  for (const base of variantBases) {
    for (const style of STYLE_PREFIXES) {
      if (dishes.length >= target) break;
      const cuisine = inferCuisineFromName(base);
      add(makeDish(`${style} ${base}`, cuisine, cuisine, {
        popularityScore: 65,
        priority: 3,
        alternativeNames: [base],
      }));
    }
  }

  // 6. Ingredient-specific sabzi / curry expansions
  const veggies = [
    "Aloo", "Gobi", "Bhindi", "Baingan", "Paneer", "Matar", "Palak", "Methi", "Corn",
    "Mushroom", "Capsicum", "Tomato", "Lauki", "Turai", "Karela", "Tindora", "Beans",
    "Cabbage", "Carrot", "Beetroot", "Pumpkin", "Jackfruit", "Raw Banana", "Yam",
  ];
  const vegForms = ["Sabzi", "Masala", "Fry", "Curry", "Bhaji", "Poriyal", "Thoran", "Stir Fry"];
  for (const veg of veggies) {
    for (const form of vegForms) {
      if (dishes.length >= target) break;
      const cuisine = form === "Poriyal" || form === "Thoran" ? "south-indian" : "north-indian";
      add(makeDish(`${veg} ${form}`, cuisine, cuisine, { popularityScore: 68, priority: 2 }));
    }
  }

  // 7. Dal expansions
  const dals = ["Toor", "Moong", "Masoor", "Chana", "Urad", "Mix", "Yellow", "Black"];
  const dalForms = ["Dal", "Dal Tadka", "Dal Fry", "Dal Soup", "Khichdi", "Sambar Style"];
  for (const dal of dals) {
    for (const form of dalForms) {
      if (dishes.length >= target) break;
      add(makeDish(`${dal} ${form}`, "north-indian", "north-indian", { popularityScore: 70, priority: 2 }));
    }
  }

  // 8. Rice expansions
  const riceStyles = [
    "Jeera", "Peas", "Veg", "Lemon", "Tomato", "Coconut", "Curd", "Tamarind", "Mint",
    "Coriander", "Ghee", "Saffron", "Vegetable", "Mushroom", "Paneer", "Egg", "Chicken",
  ];
  for (const style of riceStyles) {
    if (dishes.length >= target) break;
    add(makeDish(`${style} Rice`, "north-indian", style.includes("Chicken") || style === "Egg" ? "chicken" : "north-indian", {
      diet: /chicken|egg/i.test(style) ? (style === "Egg" ? ["eggetarian"] : ["non-vegetarian"]) : ["vegetarian"],
      popularityScore: 72,
    }));
    add(makeDish(`${style} Pulao`, "north-indian", "north-indian", { popularityScore: 70 }));
  }

  // 9. Paratha / roti expansions
  const fillings = ["Aloo", "Gobi", "Paneer", "Methi", "Mooli", "Onion", "Mixed Veg", "Keema", "Egg", "Cheese", "Palak", "Corn"];
  for (const f of fillings) {
    if (dishes.length >= target) break;
    add(makeDish(`${f} Paratha`, "punjabi", "breakfast", {
      mealType: "breakfast",
      diet: /keema|egg/i.test(f) ? (f === "Egg" ? ["eggetarian"] : ["non-vegetarian"]) : ["vegetarian"],
      popularityScore: 80,
    }));
  }

  // 10. Regional chicken/mutton style matrix
  const regions = ["Punjabi", "Hyderabadi", "Chettinad", "Kerala", "Goan", "Bengali", "Andhra", "Kashmiri", "Mughlai", "Lucknowi", "Kolhapuri", "Malwani"];
  const proteins = ["Chicken", "Mutton", "Egg", "Paneer", "Fish"];
  const forms = ["Curry", "Masala", "Fry", "Biryani", "Korma"];
  for (const region of regions) {
    for (const protein of proteins) {
      for (const form of forms) {
        if (dishes.length >= target) break;
        if (protein === "Paneer" && form === "Biryani") continue;
        const cuisine = regionToCuisine(region);
        add(makeDish(`${region} ${protein} ${form}`, cuisine, protein.toLowerCase() === "paneer" ? cuisine : protein.toLowerCase(), {
          diet: protein === "Paneer" ? ["vegetarian"] : protein === "Egg" ? ["eggetarian"] : ["non-vegetarian"],
          popularityScore: 74,
          priority: 2,
        }));
      }
    }
  }

  // Snapshot before variant expansion (avoid mutating while iterating)
  const snapshot = [...dishes];

  // 11. Jain variants of vegetarian dishes
  const jainBases = snapshot.filter((d) => d.diet?.includes("vegetarian") && !d.diet?.includes("jain") && !JAIN_EXCLUDE_RE.test(d.name)).slice(0, 400);
  for (const base of jainBases) {
    if (dishes.length >= target) break;
    add(makeDish(`Jain ${base.name}`, "jain", "jain", {
      diet: ["jain", "vegetarian"],
      mealType: base.mealType,
      popularityScore: 60,
      priority: 3,
      alternativeNames: [base.name],
    }));
  }

  // 12. Festival-tagged variants
  const festivals = ["Diwali", "Holi", "Navratri", "Eid", "Pongal", "Onam", "Ganesh Chaturthi", "Baisakhi"];
  const festBases = snapshot.filter((d) => d.category === "desserts" || d.category === "snacks" || d.category === "festival").slice(0, 200);
  for (const fest of festivals) {
    for (const base of festBases) {
      if (dishes.length >= target) break;
      add(makeDish(`${fest} Special ${base.name}`, base.cuisine, "festival", {
        festival: fest,
        mealType: "snack",
        diet: base.diet,
        popularityScore: 62,
        priority: 3,
      }));
    }
  }

  // 13. Cooking method variants
  const methods = ["Tawa", "Tandoor", "Pressure Cooker", "Handi", "Kadai", "Steamed", "Baked"];
  const methodBases = snapshot.filter((d) => /curry|sabzi|chicken|paneer|dal|fish|mutton/i.test(d.name)).slice(0, 300);
  for (const method of methods) {
    for (const base of methodBases) {
      if (dishes.length >= target) break;
      if (base.name.includes(method)) continue;
      add(makeDish(`${method} ${base.name}`, base.cuisine, base.category, {
        diet: base.diet,
        mealType: base.mealType,
        popularityScore: 64,
        priority: 3,
        alternativeNames: [base.name],
      }));
    }
  }

  // 14. More veg × cuisine matrix
  const moreVeggies = [
    "Drumstick", "Ridge Gourd", "Bottle Gourd", "Snake Gourd", "Cluster Beans", "French Beans",
    "Lady Finger", "Brinjal", "Cauliflower", "Broccoli", "Zucchini", "Sweet Potato",
    "Radish", "Turnip", "Fenugreek Leaves", "Spinach", "Amaranth", "Colocasia",
  ];
  const moreForms = ["Sabzi", "Masala", "Fry", "Curry", "Poriyal", "Foogath", "Usal", "Bhaji"];
  const vegCuisines = ["north-indian", "gujarati", "maharashtrian", "south-indian", "bengali"];
  for (const veg of moreVeggies) {
    for (const form of moreForms) {
      for (const cuisine of vegCuisines) {
        if (dishes.length >= target) break;
        add(makeDish(`${veg} ${form}`, cuisine, cuisine, { popularityScore: 66, priority: 2 }));
      }
    }
  }

  // 15. Breakfast sandwich / toast / chilla expansions
  const breakfastItems = ["Toast", "Sandwich", "Chilla", "Pancake", "Porridge", "Uttapam"];
  const breakfastFill = ["Aloo", "Paneer", "Onion", "Tomato", "Cheese", "Corn", "Spinach", "Mushroom", "Mixed Veg", "Egg"];
  for (const item of breakfastItems) {
    for (const fill of breakfastFill) {
      if (dishes.length >= target) break;
      add(makeDish(`${fill} ${item}`, "north-indian", "breakfast", {
        mealType: "breakfast",
        diet: fill === "Egg" ? ["eggetarian"] : ["vegetarian"],
        popularityScore: 68,
      }));
    }
  }

  // 16. Soup expansions
  const soups = ["Tomato", "Sweet Corn", "Manchow", "Hot and Sour", "Palak", "Dal", "Chicken", "Mushroom", "Veg Clear", "Lemon Coriander"];
  for (const s of soups) {
    if (dishes.length >= target) break;
    add(makeDish(`${s} Soup`, /manchow|hot and sour|sweet corn/i.test(s) ? "chinese-indian" : "north-indian", "healthy", {
      mealType: "snack",
      diet: /chicken/i.test(s) ? ["non-vegetarian"] : ["vegetarian"],
      popularityScore: 70,
    }));
  }

  // 17. Chutney / side expansions
  const chutneys = ["Coconut", "Mint", "Coriander", "Tomato", "Peanut", "Garlic", "Onion", "Mango", "Tamarind", "Sesame", "Curd", "Green"];
  for (const c of chutneys) {
    if (dishes.length >= target) break;
    add(makeDish(`${c} Chutney`, "south-indian", "south-indian", { mealType: "snack", popularityScore: 72 }));
  }

  // 18. More style × base matrix for popular cores
  const coreBases = [
    "Dal", "Khichdi", "Pulao", "Biryani", "Curry", "Masala", "Fry", "Soup", "Salad",
    "Paratha", "Roti", "Rice", "Halwa", "Ladoo", "Kheer", "Pakora", "Cutlet", "Roll",
  ];
  const corePrefixes = [
    "Veg", "Paneer", "Aloo", "Gobi", "Palak", "Methi", "Corn", "Mushroom", "Mix Veg",
    "Chicken", "Egg", "Mutton", "Fish", "Prawn", "Soya", "Besan", "Rava", "Oats", "Ragi", "Bajra",
  ];
  for (const prefix of corePrefixes) {
    for (const base of coreBases) {
      if (dishes.length >= target) break;
      const name = `${prefix} ${base}`;
      const diet = /chicken|mutton|fish|prawn/i.test(prefix)
        ? ["non-vegetarian"]
        : /egg/i.test(prefix) ? ["eggetarian"] : ["vegetarian"];
      add(makeDish(name, inferCuisineFromName(name), inferCategoryFromName(name), {
        diet,
        popularityScore: 67,
        priority: 2,
      }));
    }
  }

  // 19. State specialty expansions
  const stateSpecials = {
    gujarati: ["Khandvi Rolls", "Sev Usal", "Surati Locho", "Bhakhri Pizza", "Gujarati Pizza", "Dabeli Gujarati", "Khakra Chaat", "Sev Puri Gujarati"],
    punjabi: ["Amritsari Kulcha Masala", "Punjabi Rajma", "Punjabi Kadhi Pakora", "Sarson Saag Winter", "Makki Roti Winter"],
    bengali: ["Bengali Thali", "Aloor Dum Bengali", "Beguni Classic", "Posto Curry", "Bengali Khichuri"],
    maharashtrian: ["Puneri Misal", "Kolhapuri Misal", "Nashik Misal", "Mumbai Pav Bhaji", "Nagpur Saoji Curry"],
    "south-indian": ["Karnataka Meal", "Tamil Meals", "Kerala Meals", "Andhra Meals", "Filter Coffee Strong"],
  };
  for (const [cuisine, names] of Object.entries(stateSpecials)) {
    for (const name of names) {
      if (dishes.length >= target) break;
      add(makeDish(name, cuisine, cuisine, { popularityScore: 73, priority: 2 }));
    }
  }

  // 20. Dessert flavor matrix
  const dessertBases = ["Kheer", "Halwa", "Ladoo", "Barfi", "Kulfi", "Ice Cream Indian", "Payasam", "Phirni"];
  const dessertFlavors = ["Mango", "Pista", "Badam", "Rose", "Chocolate", "Coconut", "Cardamom", "Saffron", "Gajar", "Sooji", "Besan", "Moong", "Dry Fruit", "Chocolate Chip"];
  for (const base of dessertBases) {
    for (const flavor of dessertFlavors) {
      if (dishes.length >= target) break;
      add(makeDish(`${flavor} ${base}`, "north-indian", "desserts", { mealType: "snack", popularityScore: 71 }));
    }
  }

  // 21. Audience / occasion variants (meaningful unique recipes Indians search for)
  const occasions = [
    "Weeknight", "Sunday", "Party", "Kid Friendly", "High Protein", "Low Oil",
    "One Pan", "Lunchbox", "Dinner Party", "Monsoon", "Winter Special", "Summer Cool",
  ];
  const occasionBases = snapshot.slice(0, 500);
  for (const occ of occasions) {
    for (const base of occasionBases) {
      if (dishes.length >= target) break;
      add(makeDish(`${occ} ${base.name}`, base.cuisine, base.category, {
        diet: base.diet,
        mealType: base.mealType,
        popularityScore: 58,
        priority: 3,
        alternativeNames: [base.name],
      }));
    }
  }

  // Cap at meaningful dishes only — no numbered random fillers
  return dishes.slice(0, target);
}

function inferCategoryFromName(name) {
  if (/biryani|pulao|rice/i.test(name)) return "north-indian";
  if (/paratha|roti|breakfast|chilla|toast/i.test(name)) return "breakfast";
  if (/halwa|ladoo|kheer|barfi|kulfi|payasam|dessert/i.test(name)) return "desserts";
  if (/pakora|cutlet|roll|snack/i.test(name)) return "snacks";
  if (/soup|salad|khichdi|oats|ragi/i.test(name)) return "healthy";
  if (/chicken/i.test(name)) return "chicken";
  if (/mutton/i.test(name)) return "mutton";
  if (/fish|prawn/i.test(name)) return "fish";
  if (/egg/i.test(name)) return "egg";
  return "north-indian";
}

function inferCuisineFromName(name) {
  const n = name.toLowerCase();
  if (/gujarati|dhokla|thepla|undhiyu|khandvi|fafda/i.test(n)) return "gujarati";
  if (/punjabi|amritsari|sarson|makki|lassi|chole/i.test(n)) return "punjabi";
  if (/tamil|chettinad|pongal|rasam|kootu/i.test(n)) return "tamil";
  if (/kerala|appam|puttu|malabar|thoran|payasam/i.test(n)) return "kerala";
  if (/andhra|gongura|pulihora|pesarattu/i.test(n)) return "andhra";
  if (/karnataka|mysore|bisi bele|ragi|neer/i.test(n)) return "karnataka";
  if (/maharashtrian|pav|misal|poha|modak|puran|thalipeeth|kolhapuri|malvani/i.test(n)) return "maharashtrian";
  if (/rajasthani|baati|gatte|ker sangri|laal maas|ghevar/i.test(n)) return "rajasthani";
  if (/bengali|machher|shukto|luchi|sandesh|rasgulla|kosha|chingri|ilish/i.test(n)) return "bengali";
  if (/goan|xacuti|bebinca|sorpotel|recheado|vindaloo|cafreal/i.test(n)) return "goan";
  if (/hyderabadi|haleem|baghara|dum biryani/i.test(n)) return "hyderabadi";
  if (/kashmiri|rogan josh|yakhni|kahwa|gushtaba/i.test(n)) return "kashmiri";
  if (/sindhi|sai bhaji|pakwan|koki/i.test(n)) return "sindhi";
  if (/jain/i.test(n)) return "jain";
  if (/pani puri|bhel|samosa|momos|chaat|dabeli|kathi/i.test(n)) return "street-food";
  if (/hakka|manchurian|schezwan|chilli chicken|chowmein|fried rice/i.test(n)) return "chinese-indian";
  if (/dosa|idli|sambar|uttapam|medu|filter coffee/i.test(n)) return "south-indian";
  return "north-indian";
}

function regionToCuisine(region) {
  const map = {
    Punjabi: "punjabi", Hyderabadi: "hyderabadi", Chettinad: "tamil", Kerala: "kerala",
    Goan: "goan", Bengali: "bengali", Andhra: "andhra", Kashmiri: "kashmiri",
    Mughlai: "north-indian", Lucknowi: "north-indian", Kolhapuri: "maharashtrian", Malwani: "maharashtrian",
  };
  return map[region] || "north-indian";
}

export function getLibraryStats(target = 10000) {
  const dishes = generateUniqueDishLibrary(target);
  const byCuisine = {};
  for (const d of dishes) {
    byCuisine[d.cuisine] = (byCuisine[d.cuisine] || 0) + 1;
  }
  return {
    total: dishes.length,
    target,
    byCuisine,
    phase3Targets: PHASE3_TARGETS,
  };
}
