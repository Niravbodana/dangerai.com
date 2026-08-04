/**
 * Phase 3 — curated popular Indian recipes.
 * DO NOT add random dishes. Only recipes Indians actually cook and search for.
 * Popularity scores based on search demand signals (not copied from any website).
 */

function dish(entry) {
  return {
    popularityScore: 80,
    priority: 2,
    mealType: "lunch",
    diet: ["vegetarian"],
    ...entry,
  };
}

export const POPULAR_RECIPES = [
  // ─── GUJARATI (top searched) ───
  dish({ name: "Dhokla", alternativeNames: ["Khaman Dhokla", "Steamed Dhokla"], cuisine: "gujarati", state: "Gujarat", category: "snacks", mealType: "breakfast", popularityScore: 96, priority: 1, searchKeywords: ["dhokla recipe", "khaman dhokla"] }),
  dish({ name: "Thepla", alternativeNames: ["Methi Thepla"], cuisine: "gujarati", state: "Gujarat", category: "breakfast", mealType: "breakfast", popularityScore: 94, priority: 1 }),
  dish({ name: "Undhiyu", cuisine: "gujarati", state: "Gujarat", category: "festival", mealType: "lunch", popularityScore: 92, priority: 1, festival: "Uttarayan" }),
  dish({ name: "Handvo", cuisine: "gujarati", state: "Gujarat", category: "snacks", mealType: "snack", popularityScore: 88, priority: 1 }),
  dish({ name: "Khandvi", cuisine: "gujarati", state: "Gujarat", category: "snacks", mealType: "snack", popularityScore: 90, priority: 1 }),
  dish({ name: "Fafda Jalebi", alternativeNames: ["Fafda"], cuisine: "gujarati", state: "Gujarat", category: "snacks", mealType: "breakfast", popularityScore: 91, priority: 1 }),
  dish({ name: "Gujarati Dal", alternativeNames: ["Gujarati Toor Dal"], cuisine: "gujarati", state: "Gujarat", category: "gujarati", mealType: "lunch", popularityScore: 89, priority: 1 }),
  dish({ name: "Sev Tameta", cuisine: "gujarati", state: "Gujarat", category: "gujarati", mealType: "lunch", popularityScore: 85, priority: 1 }),
  dish({ name: "Patra", alternativeNames: ["Alu Vadi"], cuisine: "gujarati", state: "Gujarat", category: "snacks", mealType: "snack", popularityScore: 84, priority: 2 }),
  dish({ name: "Gujarati Kadhi", cuisine: "gujarati", state: "Gujarat", category: "gujarati", mealType: "lunch", popularityScore: 87, priority: 1 }),
  dish({ name: "Mohanthal", cuisine: "gujarati", state: "Gujarat", category: "desserts", mealType: "snack", popularityScore: 83, priority: 2, festival: "Diwali" }),
  dish({ name: "Shrikhand", cuisine: "gujarati", state: "Gujarat", category: "desserts", mealType: "snack", popularityScore: 86, priority: 1 }),
  dish({ name: "Gathiya", cuisine: "gujarati", state: "Gujarat", category: "snacks", mealType: "snack", popularityScore: 82, priority: 2 }),

  // ─── PUNJABI ───
  dish({ name: "Dal Makhani", cuisine: "punjabi", state: "Punjab", category: "punjabi", mealType: "lunch", popularityScore: 99, priority: 1 }),
  dish({ name: "Butter Chicken", alternativeNames: ["Murgh Makhani"], cuisine: "punjabi", state: "Punjab", category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 100, priority: 1 }),
  dish({ name: "Paneer Butter Masala", alternativeNames: ["Paneer Makhani"], cuisine: "punjabi", state: "Punjab", category: "punjabi", mealType: "dinner", popularityScore: 98, priority: 1 }),
  dish({ name: "Chole Bhature", alternativeNames: ["Chana Bhatura"], cuisine: "punjabi", state: "Punjab", category: "breakfast", mealType: "breakfast", popularityScore: 97, priority: 1 }),
  dish({ name: "Sarson da Saag", alternativeNames: ["Sarson Ka Saag"], cuisine: "punjabi", state: "Punjab", category: "punjabi", mealType: "lunch", popularityScore: 93, priority: 1 }),
  dish({ name: "Makki di Roti", alternativeNames: ["Makki Ki Roti"], cuisine: "punjabi", state: "Punjab", category: "punjabi", mealType: "lunch", popularityScore: 92, priority: 1 }),
  dish({ name: "Rajma Chawal", alternativeNames: ["Rajma"], cuisine: "punjabi", state: "Punjab", category: "punjabi", mealType: "lunch", popularityScore: 95, priority: 1 }),
  dish({ name: "Amritsari Kulcha", cuisine: "punjabi", state: "Punjab", category: "breakfast", mealType: "breakfast", popularityScore: 91, priority: 1 }),
  dish({ name: "Paneer Tikka", cuisine: "punjabi", state: "Punjab", category: "snacks", mealType: "snack", popularityScore: 96, priority: 1 }),
  dish({ name: "Tandoori Chicken", cuisine: "punjabi", state: "Punjab", category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 97, priority: 1 }),
  dish({ name: "Lassi", alternativeNames: ["Punjabi Lassi", "Mango Lassi"], cuisine: "punjabi", state: "Punjab", category: "snacks", mealType: "snack", popularityScore: 90, priority: 1 }),
  dish({ name: "Aloo Paratha", cuisine: "punjabi", state: "Punjab", category: "breakfast", mealType: "breakfast", popularityScore: 96, priority: 1 }),
  dish({ name: "Gobi Paratha", cuisine: "punjabi", state: "Punjab", category: "breakfast", mealType: "breakfast", popularityScore: 88, priority: 1 }),
  dish({ name: "Kadhi Pakora", cuisine: "punjabi", state: "Punjab", category: "punjabi", mealType: "lunch", popularityScore: 86, priority: 2 }),
  dish({ name: "Pinni", cuisine: "punjabi", state: "Punjab", category: "desserts", mealType: "snack", popularityScore: 80, priority: 2, festival: "Lohri" }),

  // ─── NORTH INDIAN ───
  dish({ name: "Palak Paneer", cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 97, priority: 1 }),
  dish({ name: "Shahi Paneer", cuisine: "north-indian", state: null, category: "north-indian", mealType: "dinner", popularityScore: 95, priority: 1 }),
  dish({ name: "Malai Kofta", cuisine: "north-indian", state: null, category: "north-indian", mealType: "dinner", popularityScore: 93, priority: 1 }),
  dish({ name: "Kadai Paneer", cuisine: "north-indian", state: null, category: "north-indian", mealType: "dinner", popularityScore: 94, priority: 1 }),
  dish({ name: "Dal Tadka", alternativeNames: ["Yellow Dal Tadka"], cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 96, priority: 1 }),
  dish({ name: "Jeera Rice", cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 92, priority: 1 }),
  dish({ name: "Veg Biryani", alternativeNames: ["Vegetable Biryani"], cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 94, priority: 1 }),
  dish({ name: "Naan", alternativeNames: ["Butter Naan", "Garlic Naan"], cuisine: "north-indian", state: null, category: "north-indian", mealType: "dinner", popularityScore: 95, priority: 1 }),
  dish({ name: "Roti", alternativeNames: ["Chapati", "Phulka"], cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 98, priority: 1 }),
  dish({ name: "Raita", alternativeNames: ["Boondi Raita", "Cucumber Raita"], cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 90, priority: 1 }),
  dish({ name: "Kachumber Salad", cuisine: "north-indian", state: null, category: "healthy", mealType: "lunch", popularityScore: 82, priority: 2 }),
  dish({ name: "Baingan Bharta", alternativeNames: ["Bhartha"], cuisine: "north-indian", state: null, category: "north-indian", mealType: "lunch", popularityScore: 88, priority: 1 }),

  // ─── SOUTH INDIAN ───
  dish({ name: "Masala Dosa", cuisine: "south-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 99, priority: 1 }),
  dish({ name: "Idli", alternativeNames: ["Idly"], cuisine: "south-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 98, priority: 1 }),
  dish({ name: "Sambar", cuisine: "south-indian", state: null, category: "south-indian", mealType: "lunch", popularityScore: 97, priority: 1 }),
  dish({ name: "Rasam", cuisine: "south-indian", state: null, category: "south-indian", mealType: "lunch", popularityScore: 93, priority: 1 }),
  dish({ name: "Coconut Chutney", cuisine: "south-indian", state: null, category: "south-indian", mealType: "breakfast", popularityScore: 91, priority: 1 }),
  dish({ name: "Medu Vada", alternativeNames: ["Uddina Vada"], cuisine: "south-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 92, priority: 1 }),
  dish({ name: "Uttapam", cuisine: "south-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 90, priority: 1 }),
  dish({ name: "Pongal", alternativeNames: ["Ven Pongal"], cuisine: "tamil", state: "Tamil Nadu", category: "breakfast", mealType: "breakfast", popularityScore: 91, priority: 1, festival: "Pongal" }),
  dish({ name: "Lemon Rice", cuisine: "south-indian", state: null, category: "south-indian", mealType: "lunch", popularityScore: 88, priority: 1 }),
  dish({ name: "Curd Rice", alternativeNames: ["Thayir Sadam"], cuisine: "south-indian", state: null, category: "south-indian", mealType: "lunch", popularityScore: 89, priority: 1 }),
  dish({ name: "Appam", cuisine: "kerala", state: "Kerala", category: "breakfast", mealType: "breakfast", popularityScore: 87, priority: 1 }),
  dish({ name: "Puttu", alternativeNames: ["Puttu Kadala"], cuisine: "kerala", state: "Kerala", category: "breakfast", mealType: "breakfast", popularityScore: 85, priority: 1 }),
  dish({ name: "Bisi Bele Bath", cuisine: "karnataka", state: "Karnataka", category: "south-indian", mealType: "lunch", popularityScore: 86, priority: 1 }),
  dish({ name: "Chettinad Chicken Curry", cuisine: "tamil", state: "Tamil Nadu", category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 90, priority: 1 }),
  dish({ name: "Avial", cuisine: "kerala", state: "Kerala", category: "south-indian", mealType: "lunch", popularityScore: 84, priority: 2, festival: "Onam" }),
  dish({ name: "Filter Coffee", cuisine: "south-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 88, priority: 1 }),

  // ─── MAHARASHTRIAN ───
  dish({ name: "Pav Bhaji", cuisine: "maharashtrian", state: "Maharashtra", category: "street-food", mealType: "snack", popularityScore: 99, priority: 1 }),
  dish({ name: "Vada Pav", cuisine: "maharashtrian", state: "Maharashtra", category: "street-food", mealType: "snack", popularityScore: 98, priority: 1 }),
  dish({ name: "Misal Pav", cuisine: "maharashtrian", state: "Maharashtra", category: "street-food", mealType: "breakfast", popularityScore: 94, priority: 1 }),
  dish({ name: "Poha", alternativeNames: ["Kanda Poha"], cuisine: "maharashtrian", state: "Maharashtra", category: "breakfast", mealType: "breakfast", popularityScore: 96, priority: 1 }),
  dish({ name: "Puran Poli", cuisine: "maharashtrian", state: "Maharashtra", category: "festival", mealType: "snack", popularityScore: 90, priority: 1, festival: "Holi" }),
  dish({ name: "Modak", alternativeNames: ["Ukadiche Modak"], cuisine: "maharashtrian", state: "Maharashtra", category: "festival", mealType: "snack", popularityScore: 91, priority: 1, festival: "Ganesh Chaturthi" }),
  dish({ name: "Sabudana Khichdi", cuisine: "maharashtrian", state: "Maharashtra", category: "breakfast", mealType: "breakfast", popularityScore: 89, priority: 1, festival: "Navratri" }),
  dish({ name: "Thalipeeth", cuisine: "maharashtrian", state: "Maharashtra", category: "breakfast", mealType: "breakfast", popularityScore: 85, priority: 1 }),
  dish({ name: "Bharli Vangi", cuisine: "maharashtrian", state: "Maharashtra", category: "maharashtrian", mealType: "lunch", popularityScore: 82, priority: 2 }),
  dish({ name: "Shrikhand Puri", cuisine: "maharashtrian", state: "Maharashtra", category: "desserts", mealType: "snack", popularityScore: 83, priority: 2 }),

  // ─── RAJASTHANI ───
  dish({ name: "Dal Baati Churma", alternativeNames: ["Dal Bati"], cuisine: "rajasthani", state: "Rajasthan", category: "rajasthani", mealType: "lunch", popularityScore: 95, priority: 1 }),
  dish({ name: "Gatte ki Sabzi", cuisine: "rajasthani", state: "Rajasthan", category: "rajasthani", mealType: "lunch", popularityScore: 88, priority: 1 }),
  dish({ name: "Laal Maas", cuisine: "rajasthani", state: "Rajasthan", category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 87, priority: 1 }),
  dish({ name: "Ker Sangri", cuisine: "rajasthani", state: "Rajasthan", category: "rajasthani", mealType: "lunch", popularityScore: 80, priority: 2 }),
  dish({ name: "Pyaaz Kachori", cuisine: "rajasthani", state: "Rajasthan", category: "snacks", mealType: "snack", popularityScore: 89, priority: 1 }),
  dish({ name: "Ghevar", cuisine: "rajasthani", state: "Rajasthan", category: "desserts", mealType: "snack", popularityScore: 86, priority: 1, festival: "Teej" }),
  dish({ name: "Mirchi Vada", cuisine: "rajasthani", state: "Rajasthan", category: "snacks", mealType: "snack", popularityScore: 84, priority: 1 }),

  // ─── BENGALI ───
  dish({ name: "Machher Jhol", alternativeNames: ["Bengali Fish Curry"], cuisine: "bengali", state: "West Bengal", category: "fish", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 92, priority: 1 }),
  dish({ name: "Shukto", cuisine: "bengali", state: "West Bengal", category: "bengali", mealType: "lunch", popularityScore: 82, priority: 2 }),
  dish({ name: "Luchi Aloo Dum", alternativeNames: ["Luchi"], cuisine: "bengali", state: "West Bengal", category: "breakfast", mealType: "breakfast", popularityScore: 88, priority: 1 }),
  dish({ name: "Mishti Doi", cuisine: "bengali", state: "West Bengal", category: "desserts", mealType: "snack", popularityScore: 90, priority: 1 }),
  dish({ name: "Sandesh", cuisine: "bengali", state: "West Bengal", category: "desserts", mealType: "snack", popularityScore: 89, priority: 1 }),
  dish({ name: "Rasgulla", alternativeNames: ["Rasogolla"], cuisine: "bengali", state: "West Bengal", category: "desserts", mealType: "snack", popularityScore: 97, priority: 1 }),
  dish({ name: "Cholar Dal", cuisine: "bengali", state: "West Bengal", category: "bengali", mealType: "lunch", popularityScore: 85, priority: 1 }),
  dish({ name: "Kosha Mangsho", cuisine: "bengali", state: "West Bengal", category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 88, priority: 1 }),

  // ─── HYDERABADI ───
  dish({ name: "Hyderabadi Biryani", alternativeNames: ["Chicken Dum Biryani"], cuisine: "hyderabadi", state: "Telangana", category: "chicken", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 100, priority: 1, festival: "Eid" }),
  dish({ name: "Haleem", cuisine: "hyderabadi", state: "Telangana", category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 93, priority: 1, festival: "Ramadan" }),
  dish({ name: "Mirchi ka Salan", cuisine: "hyderabadi", state: "Telangana", category: "hyderabadi", mealType: "lunch", popularityScore: 87, priority: 1 }),
  dish({ name: "Double ka Meetha", cuisine: "hyderabadi", state: "Telangana", category: "desserts", mealType: "snack", popularityScore: 85, priority: 1 }),
  dish({ name: "Baghara Baingan", cuisine: "hyderabadi", state: "Telangana", category: "hyderabadi", mealType: "lunch", popularityScore: 83, priority: 2 }),

  // ─── GOAN ───
  dish({ name: "Goan Fish Curry", cuisine: "goan", state: "Goa", category: "fish", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 90, priority: 1 }),
  dish({ name: "Goan Prawn Curry", cuisine: "goan", state: "Goa", category: "seafood", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 88, priority: 1 }),
  dish({ name: "Xacuti", alternativeNames: ["Chicken Xacuti"], cuisine: "goan", state: "Goa", category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 86, priority: 1 }),
  dish({ name: "Bebinca", cuisine: "goan", state: "Goa", category: "desserts", mealType: "snack", popularityScore: 84, priority: 1 }),
  dish({ name: "Sorpotel", cuisine: "goan", state: "Goa", category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 82, priority: 2 }),

  // ─── KASHMIRI ───
  dish({ name: "Rogan Josh", cuisine: "kashmiri", state: "Jammu and Kashmir", category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 94, priority: 1 }),
  dish({ name: "Dum Aloo", alternativeNames: ["Kashmiri Dum Aloo"], cuisine: "kashmiri", state: "Jammu and Kashmir", category: "kashmiri", mealType: "lunch", popularityScore: 90, priority: 1 }),
  dish({ name: "Yakhni Pulao", cuisine: "kashmiri", state: "Jammu and Kashmir", category: "kashmiri", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 85, priority: 1 }),
  dish({ name: "Kahwa", cuisine: "kashmiri", state: "Jammu and Kashmir", category: "healthy", mealType: "snack", popularityScore: 80, priority: 2 }),

  // ─── SINDHI ───
  dish({ name: "Sindhi Kadhi", cuisine: "sindhi", state: null, category: "sindhi", mealType: "lunch", popularityScore: 86, priority: 1 }),
  dish({ name: "Sai Bhaji", cuisine: "sindhi", state: null, category: "sindhi", mealType: "lunch", popularityScore: 82, priority: 2 }),
  dish({ name: "Dal Pakwan", cuisine: "sindhi", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 84, priority: 1 }),
  dish({ name: "Koki", cuisine: "sindhi", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 80, priority: 2 }),

  // ─── JAIN ───
  dish({ name: "Jain Pav Bhaji", cuisine: "jain", state: null, category: "jain", mealType: "snack", diet: ["jain", "vegetarian"], popularityScore: 85, priority: 1 }),
  dish({ name: "Raw Banana Sabzi", cuisine: "jain", state: null, category: "jain", mealType: "lunch", diet: ["jain", "vegetarian"], popularityScore: 78, priority: 2 }),
  dish({ name: "Jain Biryani", cuisine: "jain", state: null, category: "jain", mealType: "lunch", diet: ["jain", "vegetarian"], popularityScore: 80, priority: 2 }),

  // ─── STREET FOOD ───
  dish({ name: "Pani Puri", alternativeNames: ["Golgappa", "Puchka"], cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 99, priority: 1 }),
  dish({ name: "Bhel Puri", cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 96, priority: 1 }),
  dish({ name: "Samosa", cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 98, priority: 1 }),
  dish({ name: "Kathi Roll", cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 92, priority: 1 }),
  dish({ name: "Dabeli", cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 88, priority: 1 }),
  dish({ name: "Chaat", alternativeNames: ["Aloo Chaat", "Papdi Chaat"], cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 94, priority: 1 }),
  dish({ name: "Momos", cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 95, priority: 1 }),
  dish({ name: "Kachori", alternativeNames: ["Dal Kachori"], cuisine: "street-food", state: null, category: "street-food", mealType: "snack", popularityScore: 90, priority: 1 }),

  // ─── BREAKFAST ───
  dish({ name: "Upma", cuisine: "south-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 91, priority: 1 }),
  dish({ name: "Paratha", alternativeNames: ["Plain Paratha"], cuisine: "north-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 95, priority: 1 }),
  dish({ name: "Besan Chilla", alternativeNames: ["Besan Cheela"], cuisine: "north-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 87, priority: 1 }),
  dish({ name: "Bread Pakora", cuisine: "north-indian", state: null, category: "breakfast", mealType: "breakfast", popularityScore: 86, priority: 1 }),
  dish({ name: "Oats Upma", cuisine: "north-indian", state: null, category: "healthy", mealType: "breakfast", popularityScore: 82, priority: 2 }),

  // ─── SNACKS ───
  dish({ name: "Pakora", alternativeNames: ["Mixed Pakora", "Onion Pakora"], cuisine: "north-indian", state: null, category: "snacks", mealType: "snack", popularityScore: 93, priority: 1 }),
  dish({ name: "Aloo Tikki", cuisine: "north-indian", state: null, category: "snacks", mealType: "snack", popularityScore: 91, priority: 1 }),
  dish({ name: "Spring Roll", cuisine: "chinese-indian", state: null, category: "snacks", mealType: "snack", popularityScore: 88, priority: 1 }),
  dish({ name: "Cutlet", alternativeNames: ["Veg Cutlet"], cuisine: "north-indian", state: null, category: "snacks", mealType: "snack", popularityScore: 85, priority: 2 }),

  // ─── DESSERTS ───
  dish({ name: "Gulab Jamun", cuisine: "north-indian", state: null, category: "desserts", mealType: "snack", popularityScore: 98, priority: 1, festival: "Diwali" }),
  dish({ name: "Kheer", alternativeNames: ["Rice Kheer", "Chawal Ki Kheer"], cuisine: "north-indian", state: null, category: "desserts", mealType: "snack", popularityScore: 96, priority: 1 }),
  dish({ name: "Jalebi", cuisine: "north-indian", state: null, category: "desserts", mealType: "snack", popularityScore: 95, priority: 1 }),
  dish({ name: "Rasmalai", cuisine: "bengali", state: "West Bengal", category: "desserts", mealType: "snack", popularityScore: 94, priority: 1 }),
  dish({ name: "Halwa", alternativeNames: ["Gajar Ka Halwa", "Sooji Halwa"], cuisine: "north-indian", state: null, category: "desserts", mealType: "snack", popularityScore: 93, priority: 1 }),
  dish({ name: "Kulfi", cuisine: "north-indian", state: null, category: "desserts", mealType: "snack", popularityScore: 91, priority: 1 }),
  dish({ name: "Ladoo", alternativeNames: ["Besan Ladoo", "Motichoor Ladoo"], cuisine: "north-indian", state: null, category: "desserts", mealType: "snack", popularityScore: 92, priority: 1, festival: "Diwali" }),

  // ─── CHINESE INDIAN ───
  dish({ name: "Hakka Noodles", alternativeNames: ["Veg Hakka Noodles"], cuisine: "chinese-indian", state: null, category: "chinese-indian", mealType: "dinner", popularityScore: 97, priority: 1 }),
  dish({ name: "Manchurian", alternativeNames: ["Gobi Manchurian", "Veg Manchurian"], cuisine: "chinese-indian", state: null, category: "chinese-indian", mealType: "dinner", popularityScore: 96, priority: 1 }),
  dish({ name: "Fried Rice", alternativeNames: ["Veg Fried Rice"], cuisine: "chinese-indian", state: null, category: "chinese-indian", mealType: "lunch", popularityScore: 97, priority: 1 }),
  dish({ name: "Chilli Chicken", cuisine: "chinese-indian", state: null, category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 95, priority: 1 }),
  dish({ name: "Hot and Sour Soup", cuisine: "chinese-indian", state: null, category: "chinese-indian", mealType: "snack", popularityScore: 88, priority: 1 }),
  dish({ name: "Schezwan Fried Rice", cuisine: "chinese-indian", state: null, category: "chinese-indian", mealType: "dinner", popularityScore: 90, priority: 1 }),

  // ─── EGG ───
  dish({ name: "Egg Curry", cuisine: "north-indian", state: null, category: "egg", mealType: "lunch", diet: ["eggetarian"], popularityScore: 94, priority: 1 }),
  dish({ name: "Egg Bhurji", alternativeNames: ["Anda Bhurji"], cuisine: "north-indian", state: null, category: "egg", mealType: "breakfast", diet: ["eggetarian"], popularityScore: 93, priority: 1 }),
  dish({ name: "Boiled Egg", alternativeNames: ["Anda"], cuisine: "north-indian", state: null, category: "egg", mealType: "breakfast", diet: ["eggetarian"], popularityScore: 90, priority: 1 }),
  dish({ name: "Omelette", alternativeNames: ["Masala Omelette"], cuisine: "north-indian", state: null, category: "egg", mealType: "breakfast", diet: ["eggetarian"], popularityScore: 92, priority: 1 }),
  dish({ name: "Egg Fried Rice", cuisine: "chinese-indian", state: null, category: "egg", mealType: "lunch", diet: ["eggetarian"], popularityScore: 88, priority: 1 }),

  // ─── CHICKEN ───
  dish({ name: "Chicken Curry", alternativeNames: ["Simple Chicken Curry"], cuisine: "north-indian", state: null, category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 98, priority: 1 }),
  dish({ name: "Chicken Biryani", cuisine: "north-indian", state: null, category: "chicken", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 99, priority: 1 }),
  dish({ name: "Chicken Tikka Masala", cuisine: "punjabi", state: "Punjab", category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 97, priority: 1 }),
  dish({ name: "Chicken Korma", cuisine: "north-indian", state: null, category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 91, priority: 1 }),
  dish({ name: "Chicken Keema", cuisine: "north-indian", state: null, category: "chicken", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 88, priority: 1 }),
  dish({ name: "Chicken 65", cuisine: "south-indian", state: null, category: "chicken", mealType: "snack", diet: ["non-vegetarian"], popularityScore: 93, priority: 1 }),

  // ─── MUTTON ───
  dish({ name: "Mutton Curry", alternativeNames: ["Gosht Curry"], cuisine: "north-indian", state: null, category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 94, priority: 1 }),
  dish({ name: "Mutton Biryani", cuisine: "hyderabadi", state: "Telangana", category: "mutton", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 96, priority: 1 }),
  dish({ name: "Keema Matar", cuisine: "north-indian", state: null, category: "mutton", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 89, priority: 1 }),
  dish({ name: "Nihari", cuisine: "north-indian", state: null, category: "mutton", mealType: "breakfast", diet: ["non-vegetarian"], popularityScore: 87, priority: 1 }),

  // ─── FISH ───
  dish({ name: "Fish Fry", cuisine: "south-indian", state: null, category: "fish", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 91, priority: 1 }),
  dish({ name: "Fish Curry", cuisine: "south-indian", state: null, category: "fish", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 93, priority: 1 }),
  dish({ name: "Amritsari Fish", cuisine: "punjabi", state: "Punjab", category: "fish", mealType: "snack", diet: ["non-vegetarian"], popularityScore: 86, priority: 1 }),
  dish({ name: "Tandoori Pomfret", cuisine: "goan", state: "Goa", category: "fish", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 84, priority: 2 }),

  // ─── SEAFOOD ───
  dish({ name: "Prawn Curry", alternativeNames: ["Jhinga Curry"], cuisine: "goan", state: "Goa", category: "seafood", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 90, priority: 1 }),
  dish({ name: "Prawn Fry", cuisine: "south-indian", state: null, category: "seafood", mealType: "snack", diet: ["non-vegetarian"], popularityScore: 88, priority: 1 }),
  dish({ name: "Crab Masala", cuisine: "south-indian", state: null, category: "seafood", mealType: "dinner", diet: ["non-vegetarian"], popularityScore: 85, priority: 1 }),
  dish({ name: "Malabar Fish Curry", cuisine: "kerala", state: "Kerala", category: "seafood", mealType: "lunch", diet: ["non-vegetarian"], popularityScore: 87, priority: 1 }),

  // ─── HEALTHY ───
  dish({ name: "Moong Dal Khichdi", alternativeNames: ["Khichdi"], cuisine: "north-indian", state: null, category: "healthy", mealType: "lunch", popularityScore: 90, priority: 1 }),
  dish({ name: "Sprouts Salad", cuisine: "north-indian", state: null, category: "healthy", mealType: "snack", diet: ["vegan", "vegetarian"], popularityScore: 82, priority: 2 }),
  dish({ name: "Quinoa Upma", cuisine: "north-indian", state: null, category: "healthy", mealType: "breakfast", diet: ["vegan", "vegetarian"], popularityScore: 78, priority: 2 }),
  dish({ name: "Palak Soup", cuisine: "north-indian", state: null, category: "healthy", mealType: "snack", popularityScore: 80, priority: 2 }),

  // ─── FESTIVAL ───
  dish({ name: "Diwali Snacks Platter", alternativeNames: ["Namkeen Mix"], cuisine: "north-indian", state: null, category: "festival", mealType: "snack", popularityScore: 88, priority: 1, festival: "Diwali" }),
  dish({ name: "Gujiya", cuisine: "north-indian", state: null, category: "festival", mealType: "snack", popularityScore: 90, priority: 1, festival: "Holi" }),
  dish({ name: "Thandai", cuisine: "north-indian", state: null, category: "festival", mealType: "snack", popularityScore: 87, priority: 1, festival: "Holi" }),
  dish({ name: "Sewaiyan", alternativeNames: ["Sheer Khurma"], cuisine: "north-indian", state: null, category: "festival", mealType: "snack", popularityScore: 89, priority: 1, festival: "Eid" }),
  dish({ name: "Navratri Vrat Thali", cuisine: "north-indian", state: null, category: "festival", mealType: "lunch", popularityScore: 86, priority: 1, festival: "Navratri" }),
];

export function getPopularRecipeCount() {
  return POPULAR_RECIPES.length;
}

export function getPopularByCuisine(cuisine) {
  return POPULAR_RECIPES.filter((r) => r.cuisine === cuisine || r.category === cuisine);
}

export function getPhase1Recipes() {
  return POPULAR_RECIPES.filter((r) => r.priority === 1).sort((a, b) => b.popularityScore - a.popularityScore);
}
