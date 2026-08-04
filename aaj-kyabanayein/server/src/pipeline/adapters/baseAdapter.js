/**
 * Base adapter — all data sources must pass license verification first.
 */
import { verifyDatasetLicense } from "../license/licenseVerifier.js";

export class BaseSourceAdapter {
  constructor(datasetId, descriptor = {}) {
    this.datasetId = datasetId;
    this.descriptor = { id: datasetId, ...descriptor };
    this.licenseResult = null;
  }

  /** Must be called before fetch — gate for legal compliance. */
  verifyLicense(runId = null) {
    this.licenseResult = verifyDatasetLicense(
      { id: this.datasetId, ...this.descriptor },
      { runId }
    );
    return this.licenseResult;
  }

  assertLicensed() {
    if (!this.licenseResult?.allowed) {
      throw new Error(
        `Dataset "${this.datasetId}" not licensed for import: ${this.licenseResult?.reason || "not verified"}`
      );
    }
  }

  /** @returns {Promise<object[]>} raw records */
  async fetch() {
    throw new Error("fetch() must be implemented by adapter");
  }
}
