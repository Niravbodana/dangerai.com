export const DEFAULT_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1585937421612-70a008296fbe?w=600&h=450&fit=crop&q=80";

export const FOOD_IMAGES = {
  breakfast: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1626074353767-517a3e4b5e9e?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&h=450&fit=crop&q=80",
  ],
  lunch: [
    "https://images.unsplash.com/photo-1585937421612-70a008296fbe?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1546833998-877b37c2b5cd?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=450&fit=crop&q=80",
  ],
  dinner: [
    "https://images.unsplash.com/photo-1563379091339-03246963d96a?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574484854995-79e93e2d6e3c?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512058564876-185f39845df5?w=600&h=450&fit=crop&q=80",
  ],
  snack: [
    "https://images.unsplash.com/photo-1606491956689-2ea866880fbc?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529042410759-befb1204bda8?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600&h=450&fit=crop&q=80",
  ],
  healthy: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=80",
  ],
  nonveg: [
    "https://images.unsplash.com/photo-1604908176997-125f629cc3f3?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=450&fit=crop&q=80",
  ],
  indian: [
    "https://images.unsplash.com/photo-1585937421612-70a008296fbe?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563379091339-03246963d96a?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1546833998-877b37c2b5cd?w=600&h=450&fit=crop&q=80",
  ],
  chinese: [
    "https://images.unsplash.com/photo-1563379091339-03246963d96a?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1525755662778-989d0520907e?w=600&h=450&fit=crop&q=80",
  ],
  italian: [
    "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=80",
  ],
  korean: [
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=450&fit=crop&q=80",
  ],
  thai: [
    "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&h=450&fit=crop&q=80",
  ],
  mexican: [
    "https://images.unsplash.com/photo-1565299585323-38174c4aabaa?w=600&h=450&fit=crop&q=80",
  ],
};

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 10000;
  return h;
}

export function getRecipeImage(recipe) {
  const cuisine = recipe.cuisine?.toLowerCase();
  const cuisinePool = FOOD_IMAGES[cuisine];

  const pool = recipe.diet?.includes("non-veg")
    ? FOOD_IMAGES.nonveg
    : recipe.tags?.includes("healthy")
      ? FOOD_IMAGES.healthy
      : cuisinePool ||
        FOOD_IMAGES[recipe.mealType] ||
        FOOD_IMAGES.lunch;

  if (!pool?.length) return DEFAULT_FOOD_IMAGE;
  return pool[hashId(recipe.id || recipe.name || "x") % pool.length];
}
