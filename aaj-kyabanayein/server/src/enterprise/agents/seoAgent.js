/**
 * 9. SEO Agent — meta, schema, OG, Twitter, breadcrumbs, canonical.
 */
import { BaseAgent } from "./baseAgent.js";
import { buildSeoBundle } from "../../intelligence/seoBundle.js";

export class SeoAgent extends BaseAgent {
  constructor() {
    super("seo");
  }

  async execute(context) {
    const recipe = context.recipe || context;
    const seo = buildSeoBundle(recipe);

    const hasTitle = Boolean(seo.seoTitle);
    const hasDesc = Boolean(seo.seoDescription && seo.seoDescription.length >= 50);
    const hasSchema = Boolean(seo.recipeSchema);
    const hasFaq = Boolean(seo.faqSchema);
    const hasOg = Boolean(seo.openGraph?.["og:title"]);
    const hasCanonical = Boolean(seo.canonicalUrl);

    const score = [hasTitle, hasDesc, hasSchema, hasFaq, hasOg, hasCanonical].filter(Boolean).length;
    const confidence = score / 6;

    return {
      success: hasTitle && hasDesc && hasSchema,
      confidence,
      data: {
        seoTitle: seo.seoTitle,
        seoDescription: seo.seoDescription,
        metaTags: seo.metaTags,
        recipeSchema: seo.recipeSchema,
        faqSchema: seo.faqSchema,
        breadcrumbSchema: seo.breadcrumbSchema,
        openGraph: seo.openGraph,
        twitterCards: seo.twitterCards,
        canonicalUrl: seo.canonicalUrl,
        seoBundle: seo,
      },
      issues: !hasDesc ? ["Meta description too short"] : [],
    };
  }
}
