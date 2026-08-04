/**
 * License verification gate — runs BEFORE any dataset import.
 * If commercial use is not explicitly allowed → SKIP and log reason.
 */
import { COMMERCIAL_LICENSES, REGISTERED_DATASETS, BLOCKED_SOURCES } from "../config/allowedSources.js";
import { logSkippedDataset } from "./skipLogger.js";

const BLOCKED_IDS = new Set(BLOCKED_SOURCES.map((b) => b.id.toLowerCase()));

/**
 * @typedef {Object} DatasetDescriptor
 * @property {string} id
 * @property {string} [name]
 * @property {string} [licenseSpdx] - SPDX or registered license id
 * @property {boolean} [commercialUseAllowed] - must be explicitly true
 * @property {boolean} [licenseExplicit] - license was explicitly stated by provider
 * @property {string} [sourceUrl]
 * @property {boolean} [attributionRequired]
 * @property {string} [attributionText]
 */

/**
 * Verify a dataset may be imported into Rasoira.
 * @param {DatasetDescriptor} dataset
 * @param {{ runId?: string, log?: boolean }} [opts]
 * @returns {{ allowed: boolean, reason?: string, license?: object, registered?: object }}
 */
export function verifyDatasetLicense(dataset, opts = {}) {
  const { runId = null, log = true } = opts;
  const id = (dataset?.id || "").toLowerCase().trim();

  if (!id) {
    const reason = "Dataset id is required";
    if (log) logSkippedDataset({ datasetId: "unknown", reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  if (BLOCKED_IDS.has(id)) {
    const blocked = BLOCKED_SOURCES.find((b) => b.id === id);
    const reason = blocked?.reason || `Source "${id}" is on the blocklist`;
    if (log) logSkippedDataset({ datasetId: id, reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  const registered = REGISTERED_DATASETS[id];
  if (registered) {
    if (registered.commercialUseAllowed !== true) {
      const reason = `Registered dataset "${id}" does not explicitly allow commercial use`;
      if (log) logSkippedDataset({ datasetId: id, reason, runId, details: registered });
      return { allowed: false, reason };
    }
    const license = COMMERCIAL_LICENSES[registered.licenseSpdx];
    if (!license?.commercialUseAllowed) {
      const reason = `License "${registered.licenseSpdx}" for dataset "${id}" is not in the commercial allowlist`;
      if (log) logSkippedDataset({ datasetId: id, reason, runId, details: registered });
      return { allowed: false, reason };
    }
    return {
      allowed: true,
      license,
      registered,
      verificationStatus: "verified",
      commercialUseAllowed: true,
      attributionRequired: registered.attributionRequired ?? license.attributionRequired,
      attributionText: registered.attributionText || null,
      source: registered.name,
      licenseSpdx: registered.licenseSpdx,
    };
  }

  if (dataset.licenseExplicit !== true) {
    const reason = `Dataset "${id}" has no explicit license statement — skipped per policy`;
    if (log) logSkippedDataset({ datasetId: id, reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  if (dataset.commercialUseAllowed !== true) {
    const reason = `Dataset "${id}" does not explicitly allow commercial use`;
    if (log) logSkippedDataset({ datasetId: id, reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  const licenseSpdx = (dataset.licenseSpdx || "").trim();
  if (!licenseSpdx) {
    const reason = `Dataset "${id}" missing licenseSpdx — cannot verify commercial rights`;
    if (log) logSkippedDataset({ datasetId: id, reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  const license = COMMERCIAL_LICENSES[licenseSpdx];
  if (!license) {
    const reason = `License "${licenseSpdx}" for dataset "${id}" is not in the commercial allowlist — skipped`;
    if (log) logSkippedDataset({ datasetId: id, reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  if (!license.commercialUseAllowed) {
    const reason = `License "${licenseSpdx}" does not permit commercial use`;
    if (log) logSkippedDataset({ datasetId: id, reason, runId, details: dataset });
    return { allowed: false, reason };
  }

  return {
    allowed: true,
    license,
    verificationStatus: "verified",
    commercialUseAllowed: true,
    attributionRequired: dataset.attributionRequired ?? license.attributionRequired,
    attributionText: dataset.attributionText || null,
    source: dataset.name || id,
    licenseSpdx,
  };
}

/**
 * Verify image license before download/storage.
 * @param {{ license?: string, licenseUrl?: string, commercialUseAllowed?: boolean, source?: string }} imageMeta
 */
export function verifyImageLicense(imageMeta, opts = {}) {
  const { runId = null, log = true } = opts;

  if (!imageMeta?.license && imageMeta?.commercialUseAllowed !== true) {
    const reason = "Image license unclear — no license string and commercialUseAllowed not explicitly true";
    if (log) logSkippedDataset({ datasetId: imageMeta?.source || "image", reason, runId, details: imageMeta });
    return { allowed: false, reason };
  }

  const spdx = normalizeImageLicense(imageMeta.license);
  if (spdx) {
    const license = COMMERCIAL_LICENSES[spdx];
    if (!license?.commercialUseAllowed) {
      const reason = `Image license "${spdx}" does not permit commercial use`;
      if (log) logSkippedDataset({ datasetId: imageMeta?.source || "image", reason, runId, details: imageMeta });
      return { allowed: false, reason };
    }
    return {
      allowed: true,
      licenseSpdx: spdx,
      attributionRequired: license.attributionRequired,
      commercialUseAllowed: true,
    };
  }

  if (imageMeta.commercialUseAllowed === true && imageMeta.licenseExplicit === true) {
    return { allowed: true, licenseSpdx: "CUSTOM", commercialUseAllowed: true };
  }

  const reason = "Image license cannot be verified for commercial use";
  if (log) logSkippedDataset({ datasetId: imageMeta?.source || "image", reason, runId, details: imageMeta });
  return { allowed: false, reason };
}

function normalizeImageLicense(raw = "") {
  const s = String(raw).toUpperCase();
  if (/CC0|CC ZERO|PUBLIC.?DOMAIN|^PD$/.test(s)) return "CC0-1.0";
  if (/CC-BY-4/.test(s)) return "CC-BY-4.0";
  if (/CC-BY-3/.test(s)) return "CC-BY-3.0";
  if (/CC-BY-SA|CC-BY-NC|ALL RIGHTS|COPYRIGHT/.test(s)) return null;
  if (/US.GOV|USDA|PUBLIC DOMAIN/.test(s)) return "US-GOV";
  return null;
}

export function isSourceBlocked(sourceId) {
  return BLOCKED_IDS.has(String(sourceId || "").toLowerCase());
}
