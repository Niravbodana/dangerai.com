/**
 * Groq API — ultra-fast recipe enrichment (Llama models).
 * Set GROQ_API_KEY in server/.env — get from https://console.groq.com
 */
const USER_AGENT = "RasoiraMealPlanner/1.0";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = () => process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function getApiKey() {
  return process.env.GROQ_API_KEY || null;
}

export function isGroqConfigured() {
  return Boolean(getApiKey());
}

function buildRecipePrompt(recipeName, cuisine) {
  const clean = recipeName
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand)\b/gi, "")
    .trim();

  return `You are an expert chef. For the dish "${clean}" (${cuisine} cuisine), return ONLY valid JSON:
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
}

function parseJsonResponse(text) {
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
  return null;
}

async function groqGenerate(prompt, retries = 2) {
  const key = getApiKey();
  if (!key) return null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        model: MODEL(),
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (res.status === 429 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn("Groq API:", res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    return parseJsonResponse(text);
  }
  return null;
}

export async function fetchRecipeFromGroq(recipeName, cuisine = "indian") {
  const data = await groqGenerate(buildRecipePrompt(recipeName, cuisine));
  if (!data?.ingredients?.length) return null;

  const clean = recipeName
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand)\b/gi, "")
    .trim();

  return {
    source: "groq",
    ingredients: data.ingredients.slice(0, 25),
    steps: data.steps?.length >= 2 ? data.steps : undefined,
    stepsHi: data.stepsHi?.length >= 2 ? data.stepsHi : data.steps,
    wikiImageTitle: data.wikiImageTitle,
    imageSearchQuery: data.imageSearchQuery || clean,
  };
}
