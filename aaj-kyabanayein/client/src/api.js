import { fetchWithRetry, formatApiError, isOffline, parseResponse } from './lib/errors';

const API_BASE = '/api';

export { formatApiError, getEmptyState, isOffline } from './lib/errors';

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
  const data = await parseResponse(res);
  if (!res.ok) {
    throw new Error(formatApiError({
      status: res.status,
      message: data.message || data.error,
      offline: isOffline(),
    }));
  }
  return data;
}

async function apiRequest(url, options = {}, { retry = true, fallback } = {}) {
  try {
    const res = await fetchWithRetry(
      () => fetch(url, options),
      { retries: retry ? 2 : 0 },
    );
    if (!res.ok) {
      const data = await parseResponse(res);
      const message = formatApiError({
        status: res.status,
        message: data.message || data.error,
        offline: isOffline(),
      });
      if (fallback !== undefined && (isOffline() || res.status >= 500)) {
        return typeof fallback === 'function' ? fallback() : fallback;
      }
      throw new Error(message);
    }
    return res.json();
  } catch (err) {
    if (fallback !== undefined && (isOffline() || err?.name === 'TypeError')) {
      return typeof fallback === 'function' ? fallback() : fallback;
    }
    if (err instanceof Error && err.message) throw err;
    throw new Error(formatApiError({ offline: isOffline() }));
  }
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
  return apiRequest(`${API_BASE}/pricing`);
}

export async function fetchMealPlan(preferences) {
  return apiRequest(`${API_BASE}/plan`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(preferences),
  });
}

export const createPlan = fetchMealPlan;

export async function fetchHealthyPlan(diet = 'veg') {
  return apiRequest(`${API_BASE}/plan/healthy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ diet }),
  });
}

export async function fetchDailyHealthyPlan(diet = 'veg') {
  return apiRequest(`${API_BASE}/plan/healthy/daily?diet=${encodeURIComponent(diet)}`);
}

export const createHealthyPlan = fetchHealthyPlan;

export async function fetchRecipe(id) {
  return apiRequest(`${API_BASE}/recipes/${id}`);
}

export async function fetchRecipeLoad(id) {
  return apiRequest(`${API_BASE}/recipes/${id}/load`);
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
  return apiRequest(`${API_BASE}/recipes?${query}`, {}, {
    fallback: { success: true, recipes: [], total: 0, totalPages: 0 },
  });
}

export async function fetchRecipeSuggestions(q, limit = 8) {
  return apiRequest(
    `${API_BASE}/recipes/suggest?q=${encodeURIComponent(q)}&limit=${limit}`,
    {},
    { fallback: { suggestions: [] } },
  );
}

export async function fetchRecipeCategories() {
  return apiRequest(`${API_BASE}/recipes/categories`);
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
  return apiRequest(`${API_BASE}/recipes/${id}/reviews`, {}, { fallback: { reviews: [] } });
}

export async function fetchFavorites(guestId) {
  return apiRequest(
    `${API_BASE}/favorites?guestId=${guestId}`,
    {},
    { fallback: { favorites: [], ids: [] } },
  );
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
  return apiRequest(`${API_BASE}/recipes/trending?limit=${limit}`, {}, {
    fallback: { recipes: [], total: 0 },
  });
}

export async function fetchPantryItems() {
  return apiRequest(`${API_BASE}/pantry/items`);
}

export async function suggestFromPantry(body) {
  return apiRequest(`${API_BASE}/pantry/suggest`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

export const pantrySuggest = suggestFromPantry;

export async function fetchDailyBrief(profile) {
  return apiRequest(`${API_BASE}/plan/daily-brief`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(profile || {}),
  });
}

export async function fetchCollections() {
  return apiRequest(`${API_BASE}/collections`, {}, { fallback: { collections: [] } });
}

export async function fetchCollection(id) {
  return apiRequest(`${API_BASE}/collections/${id}`);
}
