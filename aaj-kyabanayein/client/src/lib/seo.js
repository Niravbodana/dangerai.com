const DEFAULT_SITE = "https://rasoira.com";
const DEFAULT_OG = "/home/hero-homemaker.png";

export function getSiteUrl() {
  if (import.meta.env.VITE_SITE_URL) return import.meta.env.VITE_SITE_URL.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return DEFAULT_SITE;
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function upsertMeta(attr, key, content) {
  if (!content || typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href || typeof document === "undefined") return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSON_LD_ID = "rasoira-jsonld";

export function setJsonLd(schemas = []) {
  if (typeof document === "undefined") return;
  document.getElementById(JSON_LD_ID)?.remove();
  const list = schemas.filter(Boolean);
  if (!list.length) return;
  const script = document.createElement("script");
  script.id = JSON_LD_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(list.length === 1 ? list[0] : list);
  document.head.appendChild(script);
}

export function setPageSeo({ title, description, path = "/", image, type = "website", noindex = false }) {
  if (typeof document === "undefined") return;
  const url = absoluteUrl(path);
  const desc = description?.slice(0, 160);
  const img = absoluteUrl(image || DEFAULT_OG);

  if (title) document.title = title;
  if (desc) upsertMeta("name", "description", desc);
  upsertLink("canonical", url);

  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", desc);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:image", img);
  upsertMeta("property", "og:site_name", "Rasoira");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", desc);
  upsertMeta("name", "twitter:image", img);

  upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
}

export function orgSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rasoira",
    url,
    logo: absoluteUrl("/logo.svg"),
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rasoira",
    url: getSiteUrl(),
    description: "India's home-cooking app — 900+ recipes, Aaj Kya Banaye, pantry & voice cooking.",
    publisher: { "@type": "Organization", name: "Rasoira" },
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/recipes?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Rasoira kya hai?",
        acceptedAnswer: { "@type": "Answer", text: "Rasoira Indian home-cooking app hai — 900+ recipes, Aaj Kya Banaye daily plan, pantry search aur step-by-step cooking." },
      },
      {
        "@type": "Question",
        name: "Kya Rasoira free hai?",
        acceptedAnswer: { "@type": "Answer", text: "Haan — core recipes, search, cooking mode aur favorites free hain. Plus optional paid plan hai." },
      },
      {
        "@type": "Question",
        name: "Recipe kaise search karein?",
        acceptedAnswer: { "@type": "Answer", text: "Home ya Recipes page par dish naam search karo, cuisine filter lagao, ya Pantry se ingredients daal kar match karo." },
      },
    ],
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function recipeSchema(recipe, rating = {}) {
  const name = recipe.nameHi || recipe.name;
  const img = recipe.thumbUrl || absoluteUrl(`/api/recipes/image/${recipe.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name,
    description: `${name} — ${recipe.cookTime || 30} min, ${recipe.cuisine || "Indian"} home recipe on Rasoira.`,
    image: [absoluteUrl(img)],
    author: { "@type": "Organization", name: "Rasoira" },
    prepTime: `PT${Math.max(5, Math.round((recipe.cookTime || 30) * 0.4))}M`,
    cookTime: `PT${recipe.cookTime || 30}M`,
    recipeCategory: recipe.mealType || "Main course",
    recipeCuisine: recipe.cuisine || "Indian",
    keywords: (recipe.tags || []).join(", "),
    recipeIngredient: (recipe.ingredients || []).map((i) => `${i.quantity || ""} ${i.name}`.trim()),
    recipeInstructions: (recipe.steps || []).map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
    nutrition: recipe.calories
      ? { "@type": "NutritionInformation", calories: `${recipe.calories} calories` }
      : undefined,
    aggregateRating: rating.count > 0
      ? { "@type": "AggregateRating", ratingValue: rating.average, ratingCount: rating.count }
      : undefined,
  };
}
