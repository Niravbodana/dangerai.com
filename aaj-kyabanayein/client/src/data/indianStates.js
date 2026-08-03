/** Indian states — regional taste & collection mapping */
export const INDIAN_STATES = [
  { id: "gujarat", label: "Gujarat", labelHi: "गुजरात", defaultLang: "hi", cuisines: ["gujarati", "indian"], tags: ["gujarati", "thepla", "dhokla", "fafda"] },
  { id: "maharashtra", label: "Maharashtra", labelHi: "महाराष्ट्र", defaultLang: "hi", cuisines: ["maharashtrian", "indian"], tags: ["maharashtrian", "vada pav", "pav bhaji", "misal"] },
  { id: "punjab", label: "Punjab", labelHi: "पंजाब", defaultLang: "hi", cuisines: ["punjabi", "north-indian"], tags: ["punjabi", "paratha", "chole", "rajma"] },
  { id: "rajasthan", label: "Rajasthan", labelHi: "राजस्थान", defaultLang: "hi", cuisines: ["north-indian", "indian"], tags: ["rajasthani", "dal baati", "gatte"] },
  { id: "up", label: "Uttar Pradesh", labelHi: "उत्तर प्रदेश", defaultLang: "hi", cuisines: ["north-indian", "indian"], tags: ["awadhi", "kachori", "poori"] },
  { id: "bihar", label: "Bihar", labelHi: "बिहार", defaultLang: "hi", cuisines: ["indian", "north-indian"], tags: ["litti", "sattu", "khichdi"] },
  { id: "west-bengal", label: "West Bengal", labelHi: "पश्चिम बंगाल", defaultLang: "hi", cuisines: ["bengali", "indian"], tags: ["bengali", "fish", "mishti"] },
  { id: "tamil-nadu", label: "Tamil Nadu", labelHi: "तमिलनाडु", defaultLang: "en", cuisines: ["south-indian"], tags: ["tamil", "dosa", "idli", "sambar"] },
  { id: "kerala", label: "Kerala", labelHi: "केरल", defaultLang: "en", cuisines: ["south-indian", "kerala"], tags: ["kerala", "appam", "puttu", "fish"] },
  { id: "karnataka", label: "Karnataka", labelHi: "कर्नाटक", defaultLang: "en", cuisines: ["south-indian"], tags: ["bisi bele", "mysore", "dosa"] },
  { id: "andhra", label: "Andhra Pradesh", labelHi: "आंध्र प्रदेश", defaultLang: "en", cuisines: ["south-indian"], tags: ["andhra", "spicy", "biryani"] },
  { id: "telangana", label: "Telangana", labelHi: "तेलंगाना", defaultLang: "en", cuisines: ["south-indian", "hyderabadi"], tags: ["hyderabadi", "biryani"] },
  { id: "odisha", label: "Odisha", labelHi: "ओडिशा", defaultLang: "hi", cuisines: ["indian"], tags: ["pakhala", "chenna"] },
  { id: "assam", label: "Assam", labelHi: "असम", defaultLang: "hi", cuisines: ["indian"], tags: ["assamese", "fish"] },
  { id: "delhi-ncr", label: "Delhi NCR", labelHi: "दिल्ली NCR", defaultLang: "hi", cuisines: ["north-indian", "indian"], tags: ["street-food", "chaat", "paratha"] },
];

export function getStateById(id) {
  return INDIAN_STATES.find((s) => s.id === id) || null;
}

export function defaultLanguageForState(stateId) {
  const state = getStateById(stateId);
  return state?.defaultLang || "en";
}

export function stateLabel(state, lang = "en") {
  if (!state) return "";
  return lang === "hi" ? state.labelHi : state.label;
}
