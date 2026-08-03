import { useLanguage } from "../context/LanguageContext";

const MENU_ITEMS = [
  { id: "all", icon: "🍽️", labelEn: "All", labelHi: "सभी" },
  { id: "trending", icon: "🔥", labelEn: "Trending", labelHi: "ट्रेंडिंग" },
  { id: "veg-breakfast", icon: "🌅", labelEn: "Breakfast", labelHi: "नाश्ता" },
  { id: "veg-lunch", icon: "🍱", labelEn: "Lunch", labelHi: "दोपहर" },
  { id: "veg-dinner", icon: "🌙", labelEn: "Dinner", labelHi: "रात" },
  { id: "snack", icon: "🍿", labelEn: "Snacks", labelHi: "स्नैक" },
  { id: "healthy", icon: "💚", labelEn: "Healthy", labelHi: "स्वस्थ" },
  { id: "quick", icon: "⚡", labelEn: "Quick ≤20m", labelHi: "जल्दी" },
];

const CUISINE_QUICK = [
  { id: "all", labelEn: "All cuisines", labelHi: "सभी" },
  { id: "indian", labelEn: "Indian", labelHi: "भारतीय" },
  { id: "north-indian", labelEn: "North", labelHi: "उत्तर" },
  { id: "south-indian", labelEn: "South", labelHi: "दक्षिण" },
  { id: "gujarati", labelEn: "Gujarati", labelHi: "गुजराती" },
  { id: "maharashtrian", labelEn: "Maharashtrian", labelHi: "महाराष्ट्र" },
  { id: "bengali", labelEn: "Bengali", labelHi: "बंगाली" },
  { id: "punjabi", labelEn: "Punjabi", labelHi: "पंजाबी" },
  { id: "chinese", labelEn: "Chinese", labelHi: "चाइनीज़" },
  { id: "thai", labelEn: "Thai", labelHi: "थाई" },
  { id: "mexican", labelEn: "Mexican", labelHi: "मेक्सिकन" },
  { id: "afghani", labelEn: "Afghani", labelHi: "अफ़गानी" },
  { id: "indonesian", labelEn: "Indonesian", labelHi: "इंडोनेशियाई" },
  { id: "mughlai", labelEn: "Mughlai", labelHi: "मुग़लाई" },
  { id: "turkish", labelEn: "Turkish", labelHi: "तुर्की" },
];

export default function RecipeCategoryMenu({
  activeCategory,
  activeCuisine,
  activeDiet,
  sortTrending,
  maxCookTime,
  onSelect,
  onCuisineSelect,
}) {
  const { lang } = useLanguage();

  const isActive = (item) => {
    if (item.id === "trending") return sortTrending;
    if (item.id === "all") return !sortTrending && activeCategory === "all" && activeDiet === "all" && !maxCookTime;
    if (item.id === "quick") return !!maxCookTime && maxCookTime <= 20;
    if (item.id === "snack") return activeCategory === "snack";
    if (item.id === "healthy") return activeCategory === "healthy";
    return !sortTrending && activeCategory === item.id && activeDiet === "all" && !maxCookTime;
  };

  return (
    <div className="hidden lg:block sticky top-[65px] z-40 -mx-4 border-b border-white/[0.06] bg-[#0c0a08]/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl">
        <div className="recipe-menu-scroll flex gap-2 overflow-x-auto pb-1">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`recipe-menu-chip tap-smooth shrink-0 ${
                isActive(item) ? "recipe-menu-chip--active" : ""
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {lang === "hi" ? item.labelHi : item.labelEn}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {CUISINE_QUICK.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCuisineSelect(c.id)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                (c.id === "all" && activeCuisine === "all") || activeCuisine === c.id
                  ? "bg-white/15 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-white/5"
              }`}
            >
              {lang === "hi" ? c.labelHi : c.labelEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
