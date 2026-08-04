/**
 * USDA FoodData Central adapter — public domain nutrition data only.
 */
import { BaseSourceAdapter } from "./baseAdapter.js";
import { searchFdcFood } from "../services/nutritionCalculator.js";

export class UsdaFdcAdapter extends BaseSourceAdapter {
  constructor(queries = []) {
    super("usda-fdc");
    this.queries = queries;
  }

  async fetch() {
    this.assertLicensed();
    const results = [];
    for (const query of this.queries) {
      const food = await searchFdcFood(query);
      if (food) {
        results.push({
          fdcId: food.fdcId,
          description: food.description,
          dataSource: "usda-fdc",
          licenseSpdx: "US-GOV",
          commercialUseAllowed: true,
          attributionRequired: false,
          attributionText: "USDA FoodData Central (public domain)",
          verificationStatus: "verified",
          nutrients: food.foodNutrients,
        });
      }
    }
    return results;
  }
}
