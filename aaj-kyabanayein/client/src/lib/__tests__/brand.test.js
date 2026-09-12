import { describe, expect, it } from "vitest";
import { APP_NAME, APP_NAME_HI, APP_PLUS, brandTitle } from "../brand";
import { PLANS } from "../subscription";
import { translations } from "../../i18n/translations";

describe("RasoiSaathi brand", () => {
  it("uses RasoiSaathi as the public product name", () => {
    expect(APP_NAME).toBe("RasoiSaathi");
    expect(APP_NAME_HI).toBe("रसोई साथी");
    expect(APP_PLUS).toBe("RasoiSaathi Plus");
    expect(brandTitle("Recipes")).toBe("Recipes | RasoiSaathi");
  });

  it("shows the new name in i18n and Plus plan", () => {
    expect(translations.en.appName).toBe("RasoiSaathi");
    expect(translations.hi.appName).toBe("रसोई साथी");
    expect(PLANS.plus.name).toBe("RasoiSaathi Plus");
    expect(PLANS.plus.nameHi).toBe("रसोई साथी प्लस");
  });
});
