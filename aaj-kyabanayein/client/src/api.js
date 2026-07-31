const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("akb-token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: { ...authHeaders() } });
  return handleResponse(res);
}

export async function savePreferences(preferences) {
  const res = await fetch(`${API_BASE}/auth/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(preferences),
  });
  return handleResponse(res);
}

export async function fetchPricing() {
  const res = await fetch(`${API_BASE}/pricing`);
  if (!res.ok) throw new Error("Pricing fetch failed");
  return res.json();
}

export async function fetchMealPlan(preferences) {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error("Meal plan fetch failed");
  return res.json();
}

export async function fetchRecipes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/recipes?${query}`);
  if (!res.ok) throw new Error("Recipes fetch failed");
  return res.json();
}

export async function fetchRecipeCategories() {
  const res = await fetch(`${API_BASE}/recipes/categories`);
  if (!res.ok) throw new Error("Categories fetch failed");
  return res.json();
}

export async function fetchPantryItems() {
  const res = await fetch(`${API_BASE}/pantry/items`);
  if (!res.ok) throw new Error("Pantry items fetch failed");
  return res.json();
}

export async function suggestFromPantry(body) {
  const res = await fetch(`${API_BASE}/pantry/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Pantry suggest failed");
  return res.json();
}

export async function fetchHealthyPlan(diet = "veg") {
  const res = await fetch(`${API_BASE}/plan/healthy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ diet }),
  });
  if (!res.ok) throw new Error("Healthy plan fetch failed");
  return res.json();
}

export { getToken };
