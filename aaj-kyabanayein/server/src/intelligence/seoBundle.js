/**
 * SEO bundle — Schema.org, Open Graph, meta tags.
 */
function buildRecipeJsonLd(recipe) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title || recipe.name,
    description: recipe.introduction || recipe.seoDescription,
    image: recipe.imageUrl,
    recipeCuisine: recipe.cuisine,
    recipeCategory: recipe.mealType,
    prepTime: recipe.prepTimeMin ? `PT${recipe.prepTimeMin}M` : undefined,
    cookTime: recipe.cookTimeMin ? `PT${recipe.cookTimeMin}M` : undefined,
    recipeIngredient: (recipe.ingredients || []).map((i) => `${i.quantity || ""} ${i.name}`.trim()),
    recipeInstructions: (recipe.steps || []).map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s,
    })),
  };
}

export function buildSeoBundle(recipe) {
  const slug = recipe.slug || recipe.id;
  const canonicalUrl = recipe.canonicalUrl || `https://rasoira.com/recipe/${slug}`;
  const title = recipe.seoTitle || `${recipe.title || recipe.name} Recipe | Rasoira`;
  const description = recipe.seoDescription || recipe.introduction?.slice(0, 160) || recipe.title || recipe.name;
  const imageUrl = recipe.imageUrl || `https://rasoira.com/api/recipes/image/${recipe.id}`;

  const recipeSchema = recipe.schemaOrg || buildRecipeJsonLd(recipe);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rasoira.com/" },
      { "@type": "ListItem", position: 2, name: "Recipes", item: "https://rasoira.com/recipes" },
      { "@type": "ListItem", position: 4, name: recipe.title || recipe.name, item: canonicalUrl },
    ],
  };

  return {
    seoTitle: title,
    seoDescription: description,
    canonicalUrl,
    recipeSchema,
    breadcrumbSchema,
    faqSchema: null,
    openGraph: {
      "og:type": "article",
      "og:title": title,
      "og:description": description,
      "og:url": canonicalUrl,
      "og:image": imageUrl,
      "og:site_name": "Rasoira",
    },
    twitterCards: {
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": imageUrl,
    },
    metaTags: { title, description, canonical: canonicalUrl, robots: "index, follow" },
    internalLinks: [{ href: "/recipes", label: "All Recipes" }],
    structuredData: [recipeSchema, breadcrumbSchema],
  };
}
