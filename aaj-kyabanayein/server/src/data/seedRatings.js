/** Seed ratings & reviews — varied stars, unique comments, some empty for realism */

const NAMES = [
  "Priya S.", "Rahul M.", "Ananya K.", "Vikram P.", "Sneha R.",
  "Arjun D.", "Meera J.", "Karan B.", "Divya N.", "Amit T.",
  "Neha G.", "Rohan V.", "Kavya L.", "Suresh H.", "Pooja W.",
  "Deepak C.", "Isha M.", "Manish K.", "Ritu A.", "Sanjay P.",
];

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function rev(name, score, comment, days) {
  return {
    userId: `seed_${name.replace(/\W/g, "")}_${days}`,
    userName: name,
    score,
    comment: comment || "",
    createdAt: daysAgo(days),
    seeded: true,
  };
}

/** Per-dish: total rating count, target average, and visible text reviews */
const DISH_PROFILES = {
  "butter-chicken": {
    count: 2841,
    reviews: [
      rev("Priya S.", 5, "Best butter chicken recipe online! Creamy and rich.", 3),
      rev("Rahul M.", 5, "Restaurant quality at home. Kids loved it.", 8),
      rev("Ananya K.", 4, "Very good. Added extra kasuri methi — perfect.", 14),
      rev("Vikram P.", 5, "", 21),
      rev("Sneha R.", 5, "Sunday lunch special. Will repeat!", 28),
      rev("Arjun D.", 4, "Tasty but needed more simmering time for me.", 35),
      rev("Meera J.", 5, "Authentic Punjabi taste. Highly recommend.", 42),
      rev("Karan B.", 3, "Decent. A bit too sweet for my palate.", 55),
      rev("Divya N.", 5, "First time making — turned out amazing!", 67),
    ],
  },
  "paneer-butter-masala": {
    count: 2654,
    reviews: [
      rev("Neha G.", 5, "Paneer was so soft! Gravy is chef's kiss.", 2),
      rev("Rohan V.", 5, "Party mein banaya, sab pooch rahe the recipe.", 9),
      rev("Kavya L.", 4, "", 16),
      rev("Suresh H.", 5, "Better than our local restaurant honestly.", 24),
      rev("Pooja W.", 4, "Good recipe. Used homemade paneer.", 31),
      rev("Deepak C.", 5, "Rich, creamy, perfect with naan.", 38),
      rev("Isha M.", 4, "Nice flavours. Took 45 min not 40.", 49),
      rev("Manish K.", 5, "My wife's favourite now!", 60),
    ],
  },
  "chole-bhature": {
    count: 2487,
    reviews: [
      rev("Ritu A.", 5, "Delhi street-style chole! Bhature fluffy.", 4),
      rev("Sanjay P.", 5, "Weekend brunch sorted. Absolutely delicious.", 11),
      rev("Priya S.", 4, "Chole was perfect. Bhature need practice 😅", 18),
      rev("Rahul M.", 5, "", 25),
      rev("Ananya K.", 5, "Authentic taste. Amritsari vibes!", 33),
      rev("Vikram P.", 4, "Solid recipe. Soaked chana overnight as said.", 44),
      rev("Sneha R.", 5, "Hostel days yaad aa gayi!", 52),
    ],
  },
  "masala-dosa": {
    count: 2312,
    reviews: [
      rev("Arjun D.", 5, "Crispy dosa, spicy potato filling — perfect combo.", 5),
      rev("Meera J.", 4, "Good recipe. Fermented batter is key.", 12),
      rev("Karan B.", 5, "South Indian friend approved!", 19),
      rev("Divya N.", 4, "", 27),
      rev("Neha G.", 5, "Sambar recipe link would be nice but dosa was great.", 34),
      rev("Rohan V.", 4, "Tasty. Used store-bought batter, still worked.", 41),
      rev("Kavya L.", 5, "Breakfast favourite now.", 58),
    ],
  },
  "pav-bhaji": {
    count: 2198,
    reviews: [
      rev("Suresh H.", 5, "Mumbai style! Extra butter makes it divine.", 6),
      rev("Pooja W.", 4, "Family enjoyed. A bit messy to make but worth it.", 13),
      rev("Deepak C.", 5, "Street food at home. Kids ate 3 pavs each!", 20),
      rev("Isha M.", 4, "", 29),
      rev("Manish K.", 5, "Bhaji masala quantity was spot on.", 36),
      rev("Ritu A.", 4, "Good but I like more tomato in mine.", 47),
    ],
  },
  "biryani-veg": {
    count: 2056,
    reviews: [
      rev("Sanjay P.", 5, "Aromatic and layered perfectly. Dum technique works!", 7),
      rev("Priya S.", 4, "Long process but restaurant-level biryani.", 15),
      rev("Rahul M.", 5, "Guests thought I ordered from outside 😄", 22),
      rev("Ananya K.", 4, "", 30),
      rev("Vikram P.", 5, "Best veg biryani recipe I've found.", 39),
      rev("Sneha R.", 3, "Okay taste. Rice was slightly overcooked.", 51),
    ],
  },
  poha: {
    count: 1876,
    reviews: [
      rev("Arjun D.", 5, "Quick breakfast hero! Light and flavourful.", 1),
      rev("Meera J.", 4, "Classic Indori style poha. Loved the peanuts.", 10),
      rev("Karan B.", 5, "", 17),
      rev("Divya N.", 4, "Simple and tasty. Added pomegranate on top.", 24),
      rev("Neha G.", 5, "Every morning now. 15 min is accurate.", 33),
      rev("Rohan V.", 4, "Good but prefer more lemon.", 45),
    ],
  },
  "idli-sambar": {
    count: 1743,
    reviews: [
      rev("Kavya L.", 5, "Soft idlis, tangy sambar — South Indian approved!", 3),
      rev("Suresh H.", 4, "Sambar was excellent. Idli batter tips helped.", 11),
      rev("Pooja W.", 5, "Sunday breakfast tradition started.", 18),
      rev("Deepak C.", 4, "", 26),
      rev("Isha M.", 5, "Healthy and filling. Coconut chutney pairing 👌", 37),
      rev("Manish K.", 4, "Took longer than 40 min for me but worth it.", 48),
    ],
  },
  "dal-chawal": {
    count: 1621,
    reviews: [
      rev("Ritu A.", 5, "Comfort food done right. Ghar jaisa khana.", 4),
      rev("Sanjay P.", 4, "Simple, wholesome. Dal tadka tip is gold.", 12),
      rev("Priya S.", 5, "Daily lunch sorted. Budget friendly too.", 20),
      rev("Rahul M.", 4, "", 28),
      rev("Ananya K.", 4, "Good basics. Added ghee on rice — heaven.", 40),
      rev("Vikram P.", 3, "Fine recipe. Wanted spicier dal.", 53),
    ],
  },
  "palak-paneer": {
    count: 1489,
    reviews: [
      rev("Sneha R.", 5, "Vibrant green colour! Paneer cubes perfect.", 5),
      rev("Arjun D.", 4, "Healthy and tasty. Blanching spinach is important.", 14),
      rev("Meera J.", 5, "North Indian classic. Cream balanced well.", 22),
      rev("Karan B.", 4, "", 31),
      rev("Divya N.", 5, "Iron-rich and delicious!", 42),
    ],
  },
  "rajma-chawal": {
    count: 1356,
    reviews: [
      rev("Neha G.", 5, "Punjabi soul food. Rajma was thick and creamy.", 6),
      rev("Rohan V.", 4, "Soaked overnight — don't skip! Tastes authentic.", 16),
      rev("Kavya L.", 5, "College hostel nostalgia in a bowl.", 23),
      rev("Suresh H.", 4, "Good recipe. Added extra rajma masala.", 35),
      rev("Pooja W.", 4, "", 44),
    ],
  },
  "chicken-curry": {
    count: 1244,
    reviews: [
      rev("Deepak C.", 5, "Spicy, rich gravy. Roti ke saath perfect.", 8),
      rev("Isha M.", 4, "Family favourite. Marination step matters.", 17),
      rev("Manish K.", 4, "", 25),
      rev("Ritu A.", 5, "Weekend special every time.", 34),
      rev("Sanjay P.", 3, "Good but chicken was slightly dry — maybe my fault.", 46),
    ],
  },
  "mutton-rogan-josh": {
    count: 1187,
    reviews: [
      rev("Priya S.", 5, "Kashmiri flavours on point! Mutton tender.", 9),
      rev("Rahul M.", 4, "Special occasion dish. Slow cooking is key.", 19),
      rev("Ananya K.", 5, "Restaurant quality rogan josh at home.", 28),
      rev("Vikram P.", 4, "", 38),
      rev("Sneha R.", 4, "Rich and aromatic. Worth the wait.", 50),
    ],
  },
  "kadhi-pakora": {
    count: 1098,
    reviews: [
      rev("Arjun D.", 4, "Comforting kadhi. Pakoras stayed crispy on top.", 10),
      rev("Meera J.", 5, "Rainy day perfection with rice.", 20),
      rev("Karan B.", 4, "", 30),
      rev("Divya N.", 4, "Tangy and thick — just how I like it.", 41),
    ],
  },
  "misal-pav": {
    count: 987,
    reviews: [
      rev("Neha G.", 5, "Kolhapuri misal vibes! Farsan topping is must.", 7),
      rev("Rohan V.", 4, "Spicy and filling. Pav should be fresh.", 18),
      rev("Kavya L.", 4, "Good recipe. Sprouted moth takes planning.", 29),
      rev("Suresh H.", 5, "", 40),
    ],
  },
  "veg-manchurian": {
    count: 912,
    reviews: [
      rev("Pooja W.", 4, "Indo-Chinese done well. Crispy balls!", 11),
      rev("Deepak C.", 4, "Kids love it. Sauce was slightly sweet.", 22),
      rev("Isha M.", 5, "Party starter sorted.", 33),
      rev("Manish K.", 3, "", 45),
    ],
  },
  "aloo-gobi": {
    count: 756,
    reviews: [
      rev("Ritu A.", 4, "Dry sabzi turned out well. Not too oily.", 13),
      rev("Sanjay P.", 4, "", 24),
      rev("Priya S.", 5, "Daily sabzi recipe. Simple and reliable.", 36),
    ],
  },
  upma: {
    count: 698,
    reviews: [
      rev("Rahul M.", 4, "Quick South Indian breakfast. Rava roasted nicely.", 14),
      rev("Ananya K.", 4, "Good for busy mornings.", 26),
      rev("Vikram P.", 3, "Okay. Prefer more vegetables.", 38),
    ],
  },
  "egg-bhurji": {
    count: 645,
    reviews: [
      rev("Sneha R.", 5, "Protein breakfast in 15 min!", 8),
      rev("Arjun D.", 4, "", 20),
      rev("Meera J.", 4, "Fluffy bhurji. Bread pairing perfect.", 32),
    ],
  },
  khichdi: {
    count: 612,
    reviews: [
      rev("Karan B.", 4, "Light dinner. Ghee tadka makes it special.", 15),
      rev("Divya N.", 5, "When sick or tired — this heals!", 27),
      rev("Neha G.", 4, "", 39),
    ],
  },
  "fish-fry": {
    count: 578,
    reviews: [
      rev("Rohan V.", 4, "Coastal style fry. Crispy outside, juicy inside.", 12),
      rev("Kavya L.", 5, "Weekend treat! Lemon squeeze is essential.", 25),
      rev("Suresh H.", 3, "Decent. Mine stuck to pan a bit.", 37),
    ],
  },
  "dahi-vada": {
    count: 534,
    reviews: [
      rev("Pooja W.", 4, "Refreshing summer snack. Sweet dahi ratio 👌", 16),
      rev("Deepak C.", 4, "", 28),
      rev("Isha M.", 5, "Festival special every year now.", 41),
    ],
  },
  "baingan-bharta": {
    count: 498,
    reviews: [
      rev("Manish K.", 4, "Smoky flavour from roasting baingan — key step!", 17),
      rev("Ritu A.", 4, "Rustic and homely. Roti ke saath best.", 30),
    ],
  },
  dhokla: {
    count: 467,
    reviews: [
      rev("Sanjay P.", 4, "Soft and spongy! Eno timing matters.", 19),
      rev("Priya S.", 5, "Gujarati snack perfection.", 31),
      rev("Rahul M.", 4, "", 43),
    ],
  },
  "dal-tadka": {
    count: 423,
    reviews: [
      rev("Ananya K.", 4, "Tadka with garlic — aroma fills kitchen!", 21),
      rev("Vikram P.", 4, "Staple dal recipe. Reliable every time.", 34),
    ],
  },
  kheer: {
    count: 389,
    reviews: [
      rev("Sneha R.", 5, "Festive dessert! Creamy and cardamom-rich.", 18),
      rev("Arjun D.", 4, "Slow simmer is worth it. Family loved it.", 32),
    ],
  },
  "paratha-curd": {
    count: 312,
    reviews: [
      rev("Meera J.", 4, "Aloo paratha stuffing recipe is solid.", 22),
      rev("Karan B.", 4, "", 35),
    ],
  },
  "sprouts-salad": {
    count: 245,
    reviews: [
      rev("Divya N.", 4, "Healthy snack. Chat masala level is perfect.", 26),
    ],
  },
  "roti-sabzi": {
    count: 198,
    reviews: [],
  },
  thepla: {
    count: 167,
    reviews: [
      rev("Neha G.", 4, "Gujarati thepla for travel. Methi fresh is best.", 29),
    ],
  },
  lassi: {
    count: 134,
    reviews: [],
  },
  "sabudana-khichdi": {
    count: 156,
    reviews: [
      rev("Rohan V.", 4, "Vrat friendly and tasty. Soaking time important.", 31),
    ],
  },
};

function avgFromReviews(reviews, fallback = 4.0) {
  if (!reviews.length) return fallback;
  const sum = reviews.reduce((s, r) => s + r.score, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 100000;
  return h;
}

const SYNTH_COMMENTS = {
  5: ["Really enjoyed this!", "Will make again.", "Tasty and easy.", ""],
  4: ["Good recipe overall.", "Nice flavours, minor tweaks needed.", "Solid home cooking.", ""],
  3: ["Decent but not amazing.", "Okay for a quick meal.", ""],
  2: ["Not for my taste.", ""],
};

function synthReviews(recipeId, recipeName) {
  const h = hashId(recipeId);
  const lower = (recipeName || "").toLowerCase();

  const isFamousish = /biryani|tikka|tandoori|curry|paneer|dosa|paratha|chicken|mutton|chole|pav|dal|rajma|poha|idli/i.test(lower);
  const ratingCount = isFamousish
    ? 45 + (h % 180)
    : 12 + (h % 85);

  const reviewRoll = h % 100;
  let reviewCount = 0;
  if (reviewRoll < 35) reviewCount = 0;
  else if (reviewRoll < 70) reviewCount = 1;
  else if (reviewRoll < 90) reviewCount = 2;
  else reviewCount = 3;

  const reviews = [];
  for (let i = 0; i < reviewCount; i++) {
    const scoreRoll = (h + i * 17) % 10;
    const score = scoreRoll < 1 ? 3 : scoreRoll < 4 ? 4 : 5;
    const name = NAMES[(h + i) % NAMES.length];
    const comments = SYNTH_COMMENTS[score] || SYNTH_COMMENTS[4];
    const comment = comments[(h + i) % comments.length];
    reviews.push(rev(name, score, comment, 5 + ((h + i * 7) % 120)));
  }

  const average = reviews.length
    ? avgFromReviews(reviews)
    : Math.round((3.6 + (h % 14) / 10) * 10) / 10;

  return { average, count: ratingCount, reviews };
}

export function getSeedRating(recipeId, recipeName = "") {
  const profile = DISH_PROFILES[recipeId];
  if (profile) {
    const average = profile.reviews.length
      ? avgFromReviews(profile.reviews, 4.5)
      : Math.round((3.8 + (hashId(recipeId) % 8) / 10) * 10) / 10;
    return {
      average,
      count: profile.count,
      reviews: profile.reviews,
      seeded: true,
    };
  }

  const synth = synthReviews(recipeId, recipeName);
  return { ...synth, seeded: true };
}

export function mergeRatings(recipeId, live, recipeName = "") {
  const seed = getSeedRating(recipeId, recipeName);

  if (!live || live.count === 0) {
    return { recipeId, average: seed.average, count: seed.count };
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
