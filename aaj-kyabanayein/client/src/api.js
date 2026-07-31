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
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders() },
  });
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

export async function fetchRecipes() {
  const res = await fetch(`${API_BASE}/recipes`);
  if (!res.ok) throw new Error("Recipes fetch failed");
  return res.json();
}

export { getToken };
