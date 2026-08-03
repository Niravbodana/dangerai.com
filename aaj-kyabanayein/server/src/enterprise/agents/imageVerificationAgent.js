/**
 * 5. Image Verification Agent — CC0, public domain, commercial only.
 */
import { BaseAgent } from "./baseAgent.js";
import { validateRecipeImage } from "../../intelligence/imageValidator.js";

export class ImageVerificationAgent extends BaseAgent {
  constructor() {
    super("image_verification");
  }

  async execute(context) {
    const image = context.image || {
      url: context.imageUrl,
      license: context.imageLicense,
      commercialUseAllowed: context.imageCommercialUseAllowed,
      provider: context.imageProvider,
      author: context.imageAuthor,
      attribution: context.imageAttribution,
    };

    if (!image.url && !image.imageUrl) {
      return {
        success: true,
        confidence: 0.5,
        data: {
          imageMetadata: { skipped: true, reason: "no_image_provided" },
          imageLicense: null,
          imageSource: null,
          imageAttribution: null,
        },
        issues: ["No hero image — recipe will need image before publication"],
      };
    }

    const result = validateRecipeImage(image);

    return {
      success: result.valid,
      confidence: result.valid ? 0.95 : 0,
      data: {
        imageMetadata: result.metadata,
        imageLicense: result.metadata.license,
        imageSource: result.metadata.provider,
        imageAttribution: result.metadata.attribution,
        imageAuthor: result.metadata.author,
        verificationDate: result.metadata.verificationDate,
      },
      issues: result.issues,
    };
  }
}
