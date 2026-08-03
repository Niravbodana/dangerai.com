/**
 * Per-recipe image overrides for dishes where generic Wikipedia titles fail.
 * Only verified working URLs (HTTP 200).
 */
export const DIRECT_THUMB_OVERRIDES = {
  "dal-tadka": "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "dal-fry": "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "masoor-dal-tadka": "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "chana-dal-fry": "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "undhiyu": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Undhiyu.jpg/330px-Undhiyu.jpg",
  "undhiyu-gujarati": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Undhiyu.jpg/330px-Undhiyu.jpg",
  "thalipeeth": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Maharashtrian_Thalipith_-_1.jpg/330px-Maharashtrian_Thalipith_-_1.jpg",
  "shukto": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Sukkto.jpg/330px-Sukkto.jpg",
  "thekua": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Thekua_-_Chhath_Festival_-_Kolkata_2013-11-09_4316.JPG/330px-Thekua_-_Chhath_Festival_-_Kolkata_2013-11-09_4316.JPG",
  "zunka": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jhunka_Bhakri_Marathi_Food_by_Dr._Raju_Kasambe_DSCN0221_%288%29.jpg/330px-Jhunka_Bhakri_Marathi_Food_by_Dr._Raju_Kasambe_DSCN0221_%288%29.jpg",
  "ven-pongal": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Ven_pongal_with_sambar_and_chutney.jpg/330px-Ven_pongal_with_sambar_and_chutney.jpg",
  "kara-pongal": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Ven_pongal_with_sambar_and_chutney.jpg/330px-Ven_pongal_with_sambar_and_chutney.jpg",
  "sweet-pongal": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sakkarai_pongal.jpg/330px-Sakkarai_pongal.jpg",
  "pongal": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Ven_pongal_with_sambar_and_chutney.jpg/330px-Ven_pongal_with_sambar_and_chutney.jpg",
  "tamil-pongal-venn": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Ven_pongal_with_sambar_and_chutney.jpg/330px-Ven_pongal_with_sambar_and_chutney.jpg",
  "sooji-halwa": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Orient_sweets_%28special_halva%29_Samarkand%2C_Siyab.jpg/330px-Orient_sweets_%28special_halva%29_Samarkand%2C_Siyab.jpg",
  "sindhi-kadhi": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Kadhi_Pakora.jpg/330px-Kadhi_Pakora.jpg",
  "avial": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Aviyal%2CKerala_cuisine.jpg/330px-Aviyal%2CKerala_cuisine.jpg",
  "kerala-avial": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Aviyal%2CKerala_cuisine.jpg/330px-Aviyal%2CKerala_cuisine.jpg",
  "aamras-puri": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Fluffy_Poori_%28cropped%29.JPG/330px-Fluffy_Poori_%28cropped%29.JPG",
  "aloo-tikki": "https://www.themealdb.com/images/media/meals/uttupv1511815050.jpg",
  "shahi-paneer": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Naan_shahi_paneer.jpg/330px-Naan_shahi_paneer.jpg",
  "paneer-butter-masala": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Shahi_Paneer_%26_Butter_Naan.jpg/330px-Shahi_Paneer_%26_Butter_Naan.jpg",
  "palak-paneer": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Shahi_Paneer_%26_Butter_Naan.jpg/330px-Shahi_Paneer_%26_Butter_Naan.jpg",
};

export const IMAGE_SEARCH_OVERRIDES = {
  "dal-tadka": "Dal fry",
  "dal-fry": "Dal fry",
  "shahi-paneer": "Shahi paneer",
  "kadai-paneer": "Kadai paneer",
  "mughlai-shahi-paneer": "Shahi paneer",
  "palak-paneer": "Palak paneer",
  "paneer-butter-masala": "Paneer butter masala",
  "matar-paneer": "Matar paneer",
  "veg-manchurian": "Gobi manchurian",
  "avial": "Avial",
  "kerala-avial": "Avial",
  "aamras-puri": "Aamras",
  "aloo-tikki": "Aloo tikki",
  "poha": "Poha dish",
  "oats-upma": "Upma",
  "thalipeeth": "Thalipeeth",
  "undhiyu": "Undhiyu",
  "undhiyu-gujarati": "Undhiyu",
  "zunka": "Jhunka",
  "ven-pongal": "Pongal dish",
  "tinda-masala": "Bhindi masala",
  "tomato-rasam-veg": "Rasam",
  "sandesh": "Sandesh sweet",
  "veg-momos": "Momos dumpling",
};

export function getImageSearchOverride(recipe) {
  if (!recipe) return null;
  if (recipe.id && IMAGE_SEARCH_OVERRIDES[recipe.id]) return IMAGE_SEARCH_OVERRIDES[recipe.id];
  return null;
}

export function getDirectThumbOverride(recipe) {
  if (!recipe) return null;
  if (recipe.id && DIRECT_THUMB_OVERRIDES[recipe.id]) return DIRECT_THUMB_OVERRIDES[recipe.id];
  return null;
}
