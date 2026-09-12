/** Single source of truth for the public product name. */
export const APP_NAME = "RasoiSaathi";
export const APP_NAME_HI = "रसोई साथी";
export const APP_TAGLINE = "Kitchen companion";
export const APP_TAGLINE_HI = "Aapka rasoi saathi";
export const APP_PLUS = `${APP_NAME} Plus`;
export const APP_PLUS_HI = "रसोई साथी प्लस";
export const APP_SLOGAN = "Aapki rasoi ka saathi";
export const APP_DESCRIPTION =
  "India's home-cooking companion — 900+ real recipes, Aaj Kya Banaye, voice cook, smart pantry.";

export function brandTitle(page) {
  return page ? `${page} | ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`;
}
