/**
 * Image license validation before storage.
 */
import { verifyImageLicense } from "../pipeline/license/licenseVerifier.js";

const BLOCKED_IMAGE_DOMAINS = [
  "allrecipes.com",
  "tasty.co",
  "foodnetwork.com",
  "hebbarskitchen.com",
  "vegrecipesofindia.com",
];

/**
 * @param {object} image
 * @returns {{ valid: boolean, issues: string[], metadata: object }}
 */
export function validateRecipeImage(image = {}) {
  const issues = [];
  const url = image.url || image.imageUrl || "";

  if (!url) {
    return { valid: true, issues: [], metadata: { skipped: true, reason: "no_image" } };
  }

  for (const domain of BLOCKED_IMAGE_DOMAINS) {
    if (url.includes(domain)) {
      issues.push(`Image from blocked copyrighted domain: ${domain}`);
    }
  }

  const licenseCheck = verifyImageLicense(
    {
      license: image.license || image.imageLicense,
      commercialUseAllowed: image.commercialUseAllowed,
      licenseExplicit: Boolean(image.license || image.imageLicense),
      source: image.provider || image.source,
    },
    { log: false }
  );

  if (!licenseCheck.allowed && image.license) {
    issues.push(licenseCheck.reason || "Image license not verified for commercial use");
  }

  if (!image.license && !image.commercialUseAllowed) {
    issues.push("Image license unknown — cannot verify commercial rights");
  }

  return {
    valid: issues.length === 0,
    issues,
    metadata: {
      url,
      license: image.license || image.imageLicense || null,
      author: image.author || null,
      provider: image.provider || image.source || null,
      attribution: image.attribution || image.imageAttribution || null,
      verificationDate: new Date().toISOString(),
      commercialUseAllowed: licenseCheck.allowed,
    },
  };
}
