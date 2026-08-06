/**
 * 4. Cuisine Expert Agent — regional expertise and authenticity markers.
 */
import { BaseAgent } from "./baseAgent.js";
import { CUISINES } from "../../research/taxonomy.js";

const CUISINE_EXPERTISE = {
  gujarati: { signature: ["sweet-sour balance", "dhokla", "thepla"], oil: "groundnut oil", spice: "mild" },
  punjabi: { signature: ["tandoor", "butter-based gravies"], oil: "ghee", spice: "medium" },
  rajasthani: { signature: ["desert ingredients", "dal-baati"], oil: "mustard oil", spice: "medium" },
  maharashtrian: { signature: ["poha", "vada pav", "kokum"], oil: "peanut oil", spice: "medium" },
  tamil: { signature: ["rice-lentil staples", "tamarind", "curry leaves"], oil: "sesame oil", spice: "medium" },
  kerala: { signature: ["coconut", "banana leaf", "appam"], oil: "coconut oil", spice: "medium" },
  andhra: { signature: ["fiery chillies", "pulihora"], oil: "groundnut oil", spice: "spicy" },
  karnataka: { signature: ["bisi bele bath", "ragi"], oil: "coconut oil", spice: "medium" },
  hyderabadi: { signature: ["dum cooking", "biryani"], oil: "ghee", spice: "medium" },
  "north-indian": { signature: ["tandoor", "paneer gravies"], oil: "ghee", spice: "medium" },
  bengali: { signature: ["mustard oil", "panch phoron", "fish"], oil: "mustard oil", spice: "mild" },
  goan: { signature: ["coconut vinegar", "seafood", "Portuguese influence"], oil: "coconut oil", spice: "medium" },
  jain: { signature: ["no root vegetables", "sattvic"], oil: "vegetable oil", spice: "mild" },
  "street-food": { signature: ["quick cooking", "bold flavours"], oil: "vegetable oil", spice: "medium" },
  chinese: { signature: ["wok hei", "soy sauce", "high heat"], oil: "sesame oil", spice: "mild" },
  italian: { signature: ["olive oil", "herbs", "pasta"], oil: "olive oil", spice: "mild" },
  thai: { signature: ["fish sauce", "lime", "lemongrass"], oil: "coconut oil", spice: "spicy" },
  mexican: { signature: ["corn", "beans", "chilli"], oil: "vegetable oil", spice: "medium" },
  japanese: { signature: ["umami", "dashi", "minimal seasoning"], oil: "sesame oil", spice: "mild" },
  mediterranean: { signature: ["olive oil", "herbs", "grilled vegetables"], oil: "olive oil", spice: "mild" },
};

export class CuisineExpertAgent extends BaseAgent {
  constructor() {
    super("cuisine_expert");
  }

  async execute(context) {
    const cuisine = context.seed?.cuisine || context.cuisine || "north-indian";
    const expertise = CUISINE_EXPERTISE[cuisine] || CUISINE_EXPERTISE["north-indian"];
    const meta = CUISINES[cuisine] || {};

    return {
      success: true,
      confidence: CUISINE_EXPERTISE[cuisine] ? 0.9 : 0.5,
      data: {
        cuisine,
        region: meta.region || context.seed?.region,
        state: meta.state || context.seed?.state,
        cityOfOrigin: meta.city || null,
        expertise,
        authenticityMarkers: expertise.signature,
        recommendedOil: expertise.oil,
        typicalSpiceLevel: expertise.spice,
      },
    };
  }
}
