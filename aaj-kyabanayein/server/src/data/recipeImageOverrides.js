/**
 * Per-recipe image overrides for dishes where generic Wikipedia titles fail.
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
  "sooji-halwa": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Sooji_Halwa.jpg/330px-Sooji_Halwa.jpg",
  "sandesh": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Sandesh.JPG/330px-Sandesh.JPG",
  "tinda-masala": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bhindi_masala.jpg/330px-Bhindi_masala.jpg",
  "tomato-rasam-veg": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Rasam_%28Indian_cuisine%29.jpg/330px-Rasam_%28Indian_cuisine%29.jpg",
  "lemon-rasam": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Rasam_%28Indian_cuisine%29.jpg/330px-Rasam_%28Indian_cuisine%29.jpg",
  "rasam": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Rasam_%28Indian_cuisine%29.jpg/330px-Rasam_%28Indian_cuisine%29.jpg",
  "sindhi-kadhi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Kadhi_chawal.jpg/330px-Kadhi_chawal.jpg",
  "veg-momos": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Momo_nepal.jpg/330px-Momo_nepal.jpg",
  "sev-tameta-nu-shaak": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_onion_curry.jpg/330px-Tomato_onion_curry.jpg",
  "gujarati-sev-tameta": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_onion_curry.jpg/330px-Tomato_onion_curry.jpg",
  "tomato-bath": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Tomato_rice.jpg/330px-Tomato_rice.jpg",
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
  "poha": "Poha dish",
  "oats-upma": "Upma",
  "thalipeeth": "Thalipeeth",
  "undhiyu": "Undhiyu",
  "undhiyu-gujarati": "Undhiyu",
  "zunka": "Jhunka",
  "ven-pongal": "Pongal dish",
  "tinda-masala": "Bhindi masala",
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
