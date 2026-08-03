/**
 * Master recipe taxonomy — target 50,000+ recipes across all cuisines.
 * Seeds only; each entry is researched and written as original content.
 */

export const CUISINES = {
  gujarati: { region: "Gujarat", state: "Gujarat", country: "India" },
  punjabi: { region: "Punjab", state: "Punjab", country: "India" },
  rajasthani: { region: "Rajasthan", state: "Rajasthan", country: "India" },
  maharashtrian: { region: "Maharashtra", state: "Maharashtra", country: "India" },
  "south-indian": { region: "South India", state: null, country: "India" },
  tamil: { region: "Tamil Nadu", state: "Tamil Nadu", country: "India" },
  kerala: { region: "Kerala", state: "Kerala", country: "India" },
  andhra: { region: "Andhra Pradesh", state: "Andhra Pradesh", country: "India" },
  karnataka: { region: "Karnataka", state: "Karnataka", country: "India" },
  hyderabadi: { region: "Telangana", state: "Telangana", country: "India" },
  "north-indian": { region: "North India", state: null, country: "India" },
  bengali: { region: "West Bengal", state: "West Bengal", country: "India" },
  goan: { region: "Goa", state: "Goa", country: "India" },
  sindhi: { region: "Sindh", state: null, country: "India" },
  jain: { region: "Pan-India", state: null, country: "India" },
  odia: { region: "Odisha", state: "Odisha", country: "India" },
  assamese: { region: "Assam", state: "Assam", country: "India" },
  "street-food": { region: "Pan-India", state: null, country: "India" },
  chinese: { region: "East Asia", state: null, country: "International" },
  italian: { region: "Italy", state: null, country: "International" },
  thai: { region: "Thailand", state: null, country: "International" },
  mexican: { region: "Mexico", state: null, country: "International" },
  japanese: { region: "Japan", state: null, country: "International" },
  continental: { region: "Europe", state: null, country: "International" },
  mediterranean: { region: "Mediterranean", state: null, country: "International" },
  "middle-eastern": { region: "Middle East", state: null, country: "International" },
};

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export const CATEGORIES = [
  "veg-lunch", "veg-dinner", "veg-snack", "veg-breakfast",
  "nonveg-lunch", "nonveg-dinner", "nonveg-snack",
  "dessert", "street-food", "festival", "healthy", "drinks",
  "jain", "vegan", "kids", "gym", "diabetic-friendly", "low-carb", "high-protein",
];

export const DIET_TYPES = {
  veg: { tags: ["vegetarian"], proteins: [] },
  vegan: { tags: ["vegan", "vegetarian"], proteins: [] },
  jain: { tags: ["jain", "vegetarian"], proteins: [] },
  eggetarian: { tags: ["eggetarian"], proteins: ["egg"] },
  "non-veg": { tags: ["non-vegetarian"], proteins: ["chicken", "mutton", "fish", "seafood"] },
};

export const PROTEIN_CATEGORIES = ["egg", "chicken", "mutton", "fish", "seafood"];

/** Base dish patterns per cuisine for catalog expansion */
export const DISH_PATTERNS = {
  gujarati: ["Dhokla", "Thepla", "Undhiyu", "Handvo", "Khandvi", "Fafda", "Patra", "Sev Tameta", "Ringan no Olo", "Dal Dhokli"],
  punjabi: ["Dal Makhani", "Sarson da Saag", "Makki di Roti", "Chole", "Paneer Tikka", "Amritsari Kulcha", "Rajma", "Lassi"],
  rajasthani: ["Dal Baati", "Gatte ki Sabzi", "Ker Sangri", "Laal Maas", "Ghevar", "Mirchi Vada", "Pyaaz Kachori"],
  maharashtrian: ["Poha", "Misal Pav", "Vada Pav", "Puran Poli", "Modak", "Bharli Vangi", "Sabudana Khichdi", "Thalipeeth"],
  tamil: ["Sambar", "Rasam", "Pongal", "Dosa", "Idli", "Avial", "Chettinad Curry", "Filter Coffee"],
  kerala: ["Avial", "Appam", "Puttu", "Fish Curry", "Sadya", "Payasam", "Malabar Biryani"],
  andhra: ["Pulihora", "Gongura Pachadi", "Andhra Chicken Curry", "Pesarattu", "Gutti Vankaya"],
  karnataka: ["Bisi Bele Bath", "Mysore Pak", "Neer Dosa", "Mangalore Fish Curry", "Ragi Mudde"],
  hyderabadi: ["Hyderabadi Biryani", "Haleem", "Mirchi ka Salan", "Double ka Meetha", "Baghara Baingan"],
  bengali: ["Machher Jhol", "Shukto", "Luchi", "Mishti Doi", "Sandesh", "Cholar Dal"],
  goan: ["Fish Recheado", "Xacuti", "Bebinca", "Sorpotel", "Prawn Balchao"],
  sindhi: ["Sindhi Kadhi", "Sai Bhaji", "Koki", "Dal Pakwan", "Teevarn"],
  jain: ["Jain Pav Bhaji", "Jain Pizza", "Raw Banana Sabzi", "Jain Biryani", "Sabudana Khichdi"],
  "street-food": ["Pani Puri", "Bhel Puri", "Samosa", "Kathi Roll", "Dabeli", "Pav Bhaji", "Chaat"],
  chinese: ["Hakka Noodles", "Manchurian", "Fried Rice", "Spring Rolls", "Hot and Sour Soup"],
  italian: ["Pasta", "Risotto", "Bruschetta", "Minestrone", "Tiramisu"],
  thai: ["Green Curry", "Pad Thai", "Tom Yum", "Som Tam", "Massaman Curry"],
  mexican: ["Tacos", "Enchiladas", "Guacamole", "Quesadilla", "Churros"],
  japanese: ["Miso Soup", "Teriyaki", "Sushi Roll", "Ramen", "Tempura"],
};

export const FESTIVALS = [
  "Diwali", "Holi", "Navratri", "Eid", "Christmas", "Pongal", "Onam",
  "Ganesh Chaturthi", "Raksha Bandhan", "Janmashtami", "Ugadi", "Baisakhi",
];

export const TARGET_RECIPE_COUNT = 50_000;
