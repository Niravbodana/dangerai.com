import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import usePageSeo from "../hooks/usePageSeo";
import { faqSchema, orgSchema, websiteSchema } from "../lib/seo";

const STATIC = {
  "/": {
    title: "Rasoira — Home Cooked Food | 900+ Indian Recipes",
    description: "Rasoira — India's home-cooking app. 900+ real recipes, Aaj Kya Banaye, voice cook, smart pantry. Free core forever.",
    path: "/",
  },
  "/recipes": {
    title: "All Recipes — Search & Cook | Rasoira",
    description: "Browse 900+ Indian and world recipes with photos, ingredients, and step-by-step cooking on Rasoira.",
    path: "/recipes",
  },
  "/today": {
    title: "Aaj Kya Banaye — Daily Meal Plan | Rasoira",
    description: "Roz ka breakfast, lunch, snack aur dinner — personalised Aaj Kya Banaye plan.",
    path: "/today",
  },
  "/collections": {
    title: "Recipe Collections — Festival, Budget & More | Rasoira",
    description: "Curated recipe collections — Sunday lunch, sweets, 15-minute meals, street chaat and more.",
    path: "/collections",
  },
  "/pantry": {
    title: "Pantry Recipes — Ghar Mein Kya Pada? | Rasoira",
    description: "Jo ingredients ghar mein hain, usi se recipe suggestions — smart pantry on Rasoira.",
    path: "/pantry",
  },
  "/pricing": {
    title: "Rasoira Plus Pricing | Rasoira",
    description: "Free core recipes forever. Rasoira Plus for unlimited daily plans, offline packs and more.",
    path: "/pricing",
  },
};

export default function GlobalSeo() {
  const { pathname, search } = useLocation();

  const seo = useMemo(() => {
    if (pathname.startsWith("/recipe/") || pathname.startsWith("/cook/")) return null;
    if (pathname.startsWith("/collections/")) return null;

    if (pathname === "/recipes") {
      const params = new URLSearchParams(search);
      const q = params.get("search");
      const cuisine = params.get("cuisine");
      if (q) {
        return {
          title: `${q} Recipes — Rasoira`,
          description: `Search results for "${q}" — Indian home recipes with ingredients and cooking steps.`,
          path: `/recipes?search=${encodeURIComponent(q)}`,
        };
      }
      if (cuisine && cuisine !== "all") {
        const label = cuisine.replace(/-/g, " ");
        return {
          title: `${label} Recipes | Rasoira`,
          description: `Browse ${label} recipes — photos, ingredients, cook time on Rasoira.`,
          path: `/recipes?cuisine=${encodeURIComponent(cuisine)}`,
        };
      }
    }

    return STATIC[pathname] || {
      title: "Rasoira — Home Cooked Food",
      description: "India's home-cooking app — real recipes, daily plans, pantry search.",
      path: pathname,
      noindex: pathname !== "/" && !STATIC[pathname],
    };
  }, [pathname, search]);

  const jsonLd = useMemo(() => {
    if (pathname !== "/") return null;
    return [orgSchema(), websiteSchema(), faqSchema()];
  }, [pathname]);

  const payload = useMemo(() => {
    if (!seo && !jsonLd) return null;
    return { seo, jsonLd };
  }, [seo, jsonLd]);

  usePageSeo(payload);

  return null;
}
