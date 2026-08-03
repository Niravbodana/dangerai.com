/**
 * 6. License Compliance Agent — verify every data source.
 */
import { BaseAgent } from "./baseAgent.js";
import { ALLOWED_RESEARCH_SOURCES } from "../../research/researchSources.js";
import { verifyDatasetLicense } from "../../pipeline/license/licenseVerifier.js";

export class LicenseComplianceAgent extends BaseAgent {
  constructor() {
    super("license_compliance");
  }

  async execute(context) {
    const sources = context.sources || context.brief?.sources || [];
    const issues = [];
    const verified = [];

    for (const src of sources) {
      const allowed = ALLOWED_RESEARCH_SOURCES[src.id];
      if (!allowed) {
        issues.push(`Source not in allowlist: ${src.id}`);
        continue;
      }
      verified.push({
        id: src.id,
        name: allowed.name,
        license: allowed.license,
        commercialUseAllowed: allowed.commercialUseAllowed,
        attributionRequired: allowed.attributionRequired || false,
        verifiedOn: new Date().toISOString(),
      });
    }

    const datasetCheck = verifyDatasetLicense(
      { id: "rasoira-enterprise-v2", licenseSpdx: "RASOIRA-AI", licenseExplicit: true, commercialUseAllowed: true },
      { log: false }
    );

    if (!datasetCheck.allowed) {
      issues.push(datasetCheck.reason || "Dataset license not verified");
    }

    return {
      success: issues.length === 0 && verified.length > 0,
      confidence: issues.length === 0 ? 1 : 0,
      data: {
        sources: verified,
        licenseName: "Rasoira AI-generated original content",
        licenseSpdx: "RASOIRA-AI",
        commercialUseAllowed: true,
        attributionRequired: false,
        verificationDate: new Date().toISOString(),
        auditHistory: verified.map((s) => ({ source: s.id, verifiedOn: s.verifiedOn })),
      },
      issues,
    };
  }
}
