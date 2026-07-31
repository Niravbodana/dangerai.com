export const FOOD_IMAGES = {
  breakfast: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1626074353767-517a3e4b5e9e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1630384060421-37a3707d9f1d?w=400&h=300&fit=crop",
  ],
  lunch: [
    "https://images.unsplash.com/photo-1585937421612-70a008296f36?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop",
  ],
  dinner: [
    "https://images.unsplash.com/photo-1563379091339-03246963d96a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574484854995-79e93e2d6e3c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512058564876-185f39845df5?w=400&h=300&fit=crop",
  ],
  snack: [
    "https://images.unsplash.com/photo-1606491956689-2ea866880fbc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1529042410759-befb1204bda8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=300&fit=crop",
  ],
  healthy: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
  ],
  nonveg: [
    "https://images.unsplash.com/photo-1604908176997-125f629cc3f3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop",
  ],
};

export function getRecipeImage(recipe) {
  const pool = recipe.diet?.includes("non-veg")
    ? FOOD_IMAGES.nonveg
    : recipe.tags?.includes("healthy")
      ? FOOD_IMAGES.healthy
      : FOOD_IMAGES[recipe.mealType] || FOOD_IMAGES.lunch;

  let hash = 0;
  for (let i = 0; i < recipe.id.length; i++) {
    hash = (hash + recipe.id.charCodeAt(i)) % pool.length;
  }
  return pool[hash];
}
