/** Seed ratings & reviews for famous dishes + synthetic ratings for all recipes */

const REVIEW_POOL = {
  positive: [
    "Bilkul restaurant jaisa taste! Family ne bahut pasand kiya.",
    "Step-by-step guide se first time mein perfect bana.",
    "Authentic flavours — exactly like my mom makes it.",
    "Quick, easy, and absolutely delicious. 10/10.",
    "Best recipe I've tried on Rasoira. Will cook again!",
    "Spices balanced perfectly. Highly recommend.",
    "Sunday special banaya — sab ne taareef ki.",
    "Simple ingredients, amazing result. Love it!",
  ],
  good: [
    "Tasty and comforting. Good for weeknight dinner.",
    "Nice recipe, turned out well with minor tweaks.",
    "Solid home-style cooking. Would make again.",
    "Flavourful and filling. Kids enjoyed it too.",
    "Easy to follow. Good for beginners.",
  ],
  average: [
    "Decent recipe. Needed a bit more spice for my taste.",
    "Okay overall — might try with less oil next time.",
    "Good base recipe, I added my own masala mix.",
  ],
};

const FAMOUS_TIER1 = {
  "butter-chicken": { average: 4.9, count: 2841, reviews: 8 },
  "paneer-butter-masala": { average: 4.9, count: 2654, reviews: 8 },
  "chole-bhature": { average: 4.9, count: 2487, reviews: 7 },
  "masala-dosa": { average: 4.8, count: 2312, reviews: 7 },
  "pav-bhaji": { average: 4.8, count: 2198, reviews: 7 },
  "biryani-veg": { average: 4.8, count: 2056, reviews: 6 },
};

const FAMOUS_TIER2 = {
  poha: { average: 4.7, count: 1876, reviews: 6 },
  "idli-sambar": { average: 4.7, count: 1743, reviews: 6 },
  "dal-chawal": { average: 4.6, count: 1621, reviews: 5 },
  "palak-paneer": { average: 4.6, count: 1489, reviews: 5 },
  "rajma-chawal": { average: 4.6, count: 1356, reviews: 5 },
  "chicken-curry": { average: 4.5, count: 1244, reviews: 5 },
  "mutton-rogan-josh": { average: 4.5, count: 1187, reviews: 4 },
  "kadhi-pakora": { average: 4.5, count: 1098, reviews: 4 },
  "misal-pav": { average: 4.4, count: 987, reviews: 4 },
  "veg-manchurian": { average: 4.4, count: 912, reviews: 4 },
};

const FAMOUS_TIER3 = {
  "aloo-gobi": { average: 4.3, count: 756, reviews: 3 },
  upma: { average: 4.3, count: 698, reviews: 3 },
  "egg-bhurji": { average: 4.2, count: 645, reviews: 3 },
  khichdi: { average: 4.2, count: 612, reviews: 3 },
  "fish-fry": { average: 4.2, count: 578, reviews: 3 },
  "dahi-vada": { average: 4.1, count: 534, reviews: 3 },
  "baingan-bharta": { average: 4.1, count: 498, reviews: 2 },
  dhokla: { average: 4.1, count: 467, reviews: 2 },
  "dal-tadka": { average: 4.0, count: 423, reviews: 2 },
  kheer: { average: 4.0, count: 389, reviews: 2 },
};

const NAME_KEYWORD_TIERS = [
  { keywords: ["paneer tikka", "butter chicken", "chole bhature", "masala dosa", "pav bhaji", "hyderabadi biryani"], tier: 1 },
  { keywords: ["poha", "idli", "dosa", "biryani", "dal chawal", "rajma", "palak paneer"], tier: 2 },
  { keywords: ["paratha", "khichdi", "curry", "biryani", "tikka", "tandoori"], tier: 3 },
];

const SEED_NAMES = [
  "Priya S.", "Rahul M.", "Ananya K.", "Vikram P.", "Sneha R.",
  "Arjun D.", "Meera J.", "Karan B.", "Divya N.", "Amit T.",
];

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 100000;
  return h;
}

function pickReviews(count, average) {
  const pool = average >= 4.5 ? REVIEW_POOL.positive
    : average >= 4.0 ? REVIEW_POOL.good
    : REVIEW_POOL.average;

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const score = average >= 4.7 ? 5 : average >= 4.3 ? (i % 3 === 0 ? 4 : 5) : (i % 2 === 0 ? 4 : 5);
    const daysAgo = 2 + (hashId(`r${i}`) % 90);
    reviews.push({
      userId: `seed_user_${i}`,
      userName: SEED_NAMES[i % SEED_NAMES.length],
      score,
      comment: pool[i % pool.length],
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      seeded: true,
    });
  }
  return reviews;
}

function getTierByName(name = "") {
  const lower = name.toLowerCase();
  for (const { keywords, tier } of NAME_KEYWORD_TIERS) {
    if (keywords.some((k) => lower.includes(k))) return tier;
  }
  return null;
}

function getFamousSeed(recipeId, recipeName) {
  if (FAMOUS_TIER1[recipeId]) return FAMOUS_TIER1[recipeId];
  if (FAMOUS_TIER2[recipeId]) return FAMOUS_TIER2[recipeId];
  if (FAMOUS_TIER3[recipeId]) return FAMOUS_TIER3[recipeId];

  const nameTier = getTierByName(recipeName);
  if (nameTier === 1) return { average: 4.7 + (hashId(recipeId) % 3) / 10, count: 800 + (hashId(recipeId) % 400), reviews: 5 };
  if (nameTier === 2) return { average: 4.3 + (hashId(recipeId) % 4) / 10, count: 200 + (hashId(recipeId) % 300), reviews: 3 };
  if (nameTier === 3) return { average: 4.0 + (hashId(recipeId) % 5) / 10, count: 80 + (hashId(recipeId) % 150), reviews: 2 };
  return null;
}

export function getSeedRating(recipeId, recipeName = "") {
  const famous = getFamousSeed(recipeId, recipeName);
  if (famous) {
    const avg = Math.round(famous.average * 10) / 10;
    const reviewCount = famous.reviews || 3;
    return {
      average: avg,
      count: famous.count,
      reviews: pickReviews(reviewCount, avg),
      seeded: true,
    };
  }

  const h = hashId(recipeId);
  const count = 18 + (h % 95);
  const average = Math.round((3.7 + (h % 13) / 10) * 10) / 10;
  const reviewCount = count > 60 ? 2 : count > 35 ? 1 : 0;

  return {
    average,
    count,
    reviews: reviewCount ? pickReviews(reviewCount, average) : [],
    seeded: true,
  };
}

export function mergeRatings(recipeId, live, recipeName = "") {
  const seed = getSeedRating(recipeId, recipeName);

  if (!live || live.count === 0) {
    return {
      recipeId,
      average: seed.average,
      count: seed.count,
    };
  }

  const seedTotal = seed.average * seed.count;
  const combinedCount = seed.count + live.count;
  const combinedAvg = (seedTotal + live.total) / combinedCount;

  return {
    recipeId,
    average: Math.round(combinedAvg * 10) / 10,
    count: combinedCount,
  };
}

export function mergeReviews(recipeId, liveReviews = [], recipeName = "") {
  const seed = getSeedRating(recipeId, recipeName);
  const userReviews = liveReviews.filter((r) => !r.seeded);
  return [...userReviews, ...seed.reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
}
