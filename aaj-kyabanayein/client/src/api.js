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

export const createHealthyPlan = fetchHealthyPlan;

export async function fetchRecipe(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}`);
  if (!res.ok) throw new Error('Recipe not found');
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

export async function fetchRecipeRating(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}/rating`);
  if (!res.ok) return { average: 0, count: 0 };
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

export const pantrySuggest = suggestFromPantry;
