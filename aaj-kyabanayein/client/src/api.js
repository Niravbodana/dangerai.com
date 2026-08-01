const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('akb-token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function loginWithGoogle(credential) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  return handleResponse(res);
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) return null;
  return handleResponse(res);
}

export async function savePreferences(preferences) {
  const res = await fetch(`${API_BASE}/auth/preferences`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(preferences),
  });
  return handleResponse(res);
}

export const updatePreferences = savePreferences;

export async function fetchPricing() {
  const res = await fetch(`${API_BASE}/pricing`);
  if (!res.ok) throw new Error('Pricing fetch failed');
  return res.json();
}

export async function fetchMealPlan(preferences) {
  const res = await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error('Meal plan fetch failed');
  return res.json();
}

export const createPlan = fetchMealPlan;

export async function fetchHealthyPlan(diet = 'veg') {
  const res = await fetch(`${API_BASE}/plan/healthy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ diet }),
  });
  if (!res.ok) throw new Error('Healthy plan fetch failed');
  return res.json();
}

export async function fetchDailyHealthyPlan(diet = 'veg') {
  const res = await fetch(`${API_BASE}/plan/healthy/daily?diet=${encodeURIComponent(diet)}`);
  if (!res.ok) throw new Error('Daily healthy plan fetch failed');
  return res.json();
}

export const createHealthyPlan = fetchHealthyPlan;

export async function fetchRecipe(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}`);
  if (!res.ok) throw new Error('Recipe not found');
  return res.json();
}

/** On recipe select — fetch matching photo + enriched ingredients via Google/Gemini */
export async function fetchRecipeLoad(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}/load`);
  if (!res.ok) throw new Error('Recipe load failed');
  return res.json();
}

export async function enrichRecipe(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}/enrich`, { method: 'POST' });
  if (!res.ok) throw new Error('Enrichment failed');
  return res.json();
}

export async function addSavedMeal({ recipeId, date, mealType, guestId }) {
  const res = await fetch(`${API_BASE}/meals/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId, date, mealType, guestId }),
  });
  return handleResponse(res);
}

export async function fetchSavedMeals(guestId) {
  const res = await fetch(`${API_BASE}/meals/saved?guestId=${guestId}`);
  if (!res.ok) return { meals: [] };
  return res.json();
}

export async function removeSavedMeal(mealId, guestId) {
  const res = await fetch(`${API_BASE}/meals/saved/${mealId}?guestId=${guestId}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function addCustomMeal(body) {
  const res = await fetch(`${API_BASE}/meals/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function fetchCustomMeals(guestId) {
  const res = await fetch(`${API_BASE}/meals/custom?guestId=${guestId}`);
  if (!res.ok) return { meals: [] };
  return res.json();
}

export async function fetchRecipes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/recipes?${query}`);
  if (!res.ok) throw new Error('Recipes fetch failed');
  return res.json();
}

export async function fetchRecipeSuggestions(q, limit = 8) {
  const res = await fetch(`${API_BASE}/recipes/suggest?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return { suggestions: [] };
  return res.json();
}

export async function fetchRecipeCategories() {
  const res = await fetch(`${API_BASE}/recipes/categories`);
  if (!res.ok) throw new Error('Categories fetch failed');
  return res.json();
}

export const fetchCategories = fetchRecipeCategories;

export async function fetchRecipeRating(id, guestId) {
  const q = guestId ? `?guestId=${encodeURIComponent(guestId)}` : "";
  const res = await fetch(`${API_BASE}/recipes/${id}/rating${q}`);
  if (!res.ok) return { average: 0, count: 0, userScore: 0 };
  return res.json();
}

export async function rateRecipe(id, score, guestId) {
  const res = await fetch(`${API_BASE}/recipes/${id}/rate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ score, guestId }),
  });
  return handleResponse(res);
}

export async function submitReview(id, score, comment, guestId) {
  const res = await fetch(`${API_BASE}/recipes/${id}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ score, comment, guestId }),
  });
  return handleResponse(res);
}

export async function fetchReviews(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}/reviews`);
  if (!res.ok) return { reviews: [] };
  return res.json();
}

export async function fetchFavorites(guestId) {
  const res = await fetch(`${API_BASE}/favorites?guestId=${guestId}`);
  if (!res.ok) return { favorites: [], ids: [] };
  return res.json();
}

export async function addFavorite(recipeId, guestId) {
  await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ guestId }),
  });
}

export async function removeFavorite(recipeId, guestId) {
  await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ guestId }),
  });
}

export async function fetchTrendingRecipes(limit = 12) {
  const res = await fetch(`${API_BASE}/recipes/trending?limit=${limit}`);
  if (!res.ok) throw new Error('Trending fetch failed');
  return res.json();
}

export async function fetchPantryItems() {
  const res = await fetch(`${API_BASE}/pantry/items`);
  if (!res.ok) throw new Error('Pantry items fetch failed');
  return res.json();
}

export async function suggestFromPantry(body) {
  const res = await fetch(`${API_BASE}/pantry/suggest`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Pantry suggest failed');
  return res.json();
}

export async function fetchPantryAnalytics(body) {
  const res = await fetch(`${API_BASE}/pantry/analytics`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Pantry analytics failed');
  return res.json();
}

export async function fetchGroceryRecommendations(body) {
  const res = await fetch(`${API_BASE}/pantry/grocery`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Grocery recommendations failed');
  return res.json();
}

export const pantrySuggest = suggestFromPantry;

export async function fetchDailyBrief(profile) {
  const res = await fetch(`${API_BASE}/plan/daily-brief`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(profile || {}),
  });
  if (!res.ok) throw new Error('Daily brief failed');
  return res.json();
}

export async function fetchCollections() {
  const res = await fetch(`${API_BASE}/collections`);
  if (!res.ok) return { collections: [] };
  return res.json();
}

export async function fetchCollection(id) {
  const res = await fetch(`${API_BASE}/collections/${id}`);
  if (!res.ok) throw new Error('Collection not found');
  return res.json();
}
