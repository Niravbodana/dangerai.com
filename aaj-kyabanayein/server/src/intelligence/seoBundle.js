/**
 * Full SEO bundle — Schema.org, Open Graph, Twitter Cards, breadcrumbs, canonical.
 */
import { buildRecipeJsonLd } from "../pipeline/services/schemaOrgBuilder.js";

export function buildSeoBundle(recipe) {
  const slug = recipe.slug || recipe.id;
  const canonicalUrl = recipe.canonicalUrl || `https://rasoira.com/recipe/${slug}`;
  const title = recipe.seoTitle || `${recipe.title} Recipe | Rasoira`;
  const description = recipe.seoDescription || recipe.introduction?.slice(0, 160) || recipe.title;
  const imageUrl = recipe.imageUrl || `https://rasoira.com/api/recipes/image/${recipe.id}`;

  const recipeSchema = recipe.schemaOrg || buildRecipeJsonLd(recipe);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rasoira.com/" },
      { "@type": "ListItem", position: 2, name: "Recipes", item: "https://rasoira.com/recipes" },
      {
        "@type": "ListItem",
        position: 3,
        name: formatCuisine(recipe.cuisine),
        item: `https://rasoira.com/recipes?cuisine=${recipe.cuisine || ""}`,
      },
      { "@type": "ListItem", position: 4, name: recipe.title, item: canonicalUrl },
    ],
  };

  const faqSchema = (recipe.faq || []).length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: recipe.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const openGraph = {
    "og:type": "article",
    "og:title": title,
    "og:description": description,
    "og:url": canonicalUrl,
    "og:image": imageUrl,
    "og:site_name": "Rasoira",
    "og:locale": "en_IN",
    "article:section": formatCuisine(recipe.cuisine),
    "article:tag": (recipe.recipeTags || recipe.tags || []).join(","),
  };

  const twitterCards = {
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": imageUrl,
    "twitter:site": "@rasoira",
  };

  const metaTags = {
    title,
    description,
    canonical: canonicalUrl,
    robots: "index, follow",
    keywords: [
      recipe.title,
      recipe.cuisine,
      recipe.mealType,
      ...(recipe.diet || []),
      ...(recipe.recipeTags || recipe.tags || []),
    ]
      .filter(Boolean)
      .join(", "),
  };

  const internalLinks = buildInternalLinks(recipe);

  return {
    seoTitle: title,
    seoDescription: description,
    canonicalUrl,
    recipeSchema,
    breadcrumbSchema,
    faqSchema,
    openGraph,
    twitterCards,
    metaTags,
    internalLinks,
    structuredData: [recipeSchema, breadcrumbSchema, faqSchema].filter(Boolean),
  };
}

function buildInternalLinks(recipe) {
  const links = [
    { href: "/recipes", label: "All Recipes" },
    { href: `/recipes?cuisine=${recipe.cuisine}`, label: `${formatCuisine(recipe.cuisine)} Recipes` },
  ];
  if (recipe.mealType) {
    links.push({ href: `/recipes?mealType=${recipe.mealType}`, label: formatCuisine(recipe.mealType) });
  }
  for (const d of recipe.diet || []) {
    links.push({ href: `/recipes?diet=${d}`, label: d });
  }
  return links;
}

function formatCuisine(s = "") {
  return String(s).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
