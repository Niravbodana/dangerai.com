/**
 * Gemini API — fast recipe ingredients, steps, and image hints.
 * Uses GOOGLE_API_KEY or GEMINI_API_KEY from server/.env
 */
const USER_AGENT = "RasoiraMealPlanner/1.0";
const MODEL = () => process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

export function isGeminiConfigured() {
  return Boolean(getApiKey());
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geminiGenerate(prompt, retries = 3) {
  const key = getApiKey();
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent?key=${key}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (res.status === 429 && attempt < retries - 1) {
      await sleep(3000 * (attempt + 1));
      continue;
    }

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn("Gemini API:", res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export async function fetchRecipeFromGemini(recipeName, cuisine = "indian") {
  const clean = recipeName
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand)\b/gi, "")
    .trim();

  const prompt = `You are an expert chef. For the dish "${clean}" (${cuisine} cuisine), return ONLY valid JSON:
{
  "ingredients": [{"name":"English name","nameHi":"हिंदी नाम","quantity":"amount"}],
  "steps": ["step 1 in English", "step 2", ...],
  "stepsHi": ["कदम 1 हिंदी में", ...],
  "wikiImageTitle": "Exact Wikipedia article title for this food photo",
  "imageSearchQuery": "3-4 word Google image search for this exact dish"
}
Rules:
- Minimum 10 ingredients with realistic quantities (include spices, oil, garnish)
- Minimum 6 detailed cooking steps in both English and Hindi
- wikiImageTitle must be a real Wikipedia food article (e.g. "Aloo gobhi", "Flattened rice", "Paneer butter masala")
- imageSearchQuery must match the actual dish, not generic food
- Return JSON only, no markdown`;

  const data = await geminiGenerate(prompt);
  if (!data?.ingredients?.length) return null;

  return {
    source: "gemini",
    ingredients: data.ingredients.slice(0, 25),
    steps: data.steps?.length >= 2 ? data.steps : undefined,
    stepsHi: data.stepsHi?.length >= 2 ? data.stepsHi : data.steps,
    wikiImageTitle: data.wikiImageTitle,
    imageSearchQuery: data.imageSearchQuery || clean,
  };
}
