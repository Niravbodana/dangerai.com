/**
 * Permanent source registry — every import must register here first.
 */
import { REGISTERED_DATASETS, COMMERCIAL_LICENSES, BLOCKED_SOURCES } from "../pipeline/config/allowedSources.js";
import { verifyDatasetLicense } from "../pipeline/license/licenseVerifier.js";
import { getIntelligenceDb } from "./repository.js";
import { writeAuditLog } from "./auditLog.js";

export function seedSourceRegistry() {
  const db = getIntelligenceDb();

  for (const [id, dataset] of Object.entries(REGISTERED_DATASETS)) {
    const license = COMMERCIAL_LICENSES[dataset.licenseSpdx];
    db.prepare(`
      INSERT OR REPLACE INTO source_registry (
        id, source_name, source_url, license_name, license_url,
        commercial_use_allowed, attribution_required, attribution_text,
        robots_txt_respected, api_commercial_use, allowed_fields,
        verification_status, verified_on, imported_on, notes, updated_at
      ) VALUES (
        @id, @source_name, @source_url, @license_name, @license_url,
        @commercial_use_allowed, @attribution_required, @attribution_text,
        @robots_txt_respected, @api_commercial_use, @allowed_fields,
        'verified', @verified_on, @imported_on, @notes, datetime('now')
      )
    `).run({
      id,
      source_name: dataset.name,
      source_url: dataset.sourceUrl || null,
      license_name: license?.label || dataset.licenseSpdx,
      license_url: licenseUrlFor(dataset.licenseSpdx),
      commercial_use_allowed: dataset.commercialUseAllowed ? 1 : 0,
      attribution_required: dataset.attributionRequired ? 1 : 0,
      attribution_text: dataset.attributionText || null,
      robots_txt_respected: dataset.robotsTxtRespected ? 1 : 0,
      api_commercial_use: dataset.apiCommercialUse ? 1 : 0,
      allowed_fields: JSON.stringify(dataset.allowedFields || []),
      verified_on: new Date().toISOString(),
      imported_on: new Date().toISOString(),
      notes: dataset.notes || null,
    });
  }

  for (const blocked of BLOCKED_SOURCES) {
    db.prepare(`
      INSERT OR REPLACE INTO source_registry (
        id, source_name, license_name, commercial_use_allowed,
        verification_status, verified_on, notes, updated_at
      ) VALUES (
        @id, @source_name, 'BLOCKED', 0, 'rejected', datetime('now'), @notes, datetime('now')
      )
    `).run({
      id: blocked.id,
      source_name: blocked.id,
      notes: blocked.reason,
    });
  }
}

/**
 * Verify and register a new source before any import.
 * @returns {{ allowed: boolean, reason?: string, registry?: object }}
 */
export function validateAndRegisterSource(sourceId, meta = {}, opts = {}) {
  const verification = verifyDatasetLicense({ id: sourceId, ...meta }, opts);
  const db = getIntelligenceDb();

  if (!verification.allowed) {
    db.prepare(`
      INSERT OR REPLACE INTO source_registry (
        id, source_name, source_url, license_name, commercial_use_allowed,
        verification_status, verified_on, notes, updated_at
      ) VALUES (
        @id, @source_name, @source_url, 'UNKNOWN', 0, 'skipped', datetime('now'), @notes, datetime('now')
      )
    `).run({
      id: sourceId,
      source_name: meta.name || sourceId,
      source_url: meta.sourceUrl || null,
      notes: verification.reason,
    });

    writeAuditLog({
      action: "source_skipped",
      entityType: "source",
      entityId: sourceId,
      details: { reason: verification.reason },
    });

    return verification;
  }

  const registered = REGISTERED_DATASETS[sourceId] || meta;
  const license = COMMERCIAL_LICENSES[verification.licenseSpdx || registered.licenseSpdx];

  db.prepare(`
    INSERT OR REPLACE INTO source_registry (
      id, source_name, source_url, license_name, license_url,
      commercial_use_allowed, attribution_required, attribution_text,
      verification_status, verified_on, imported_on, updated_at
    ) VALUES (
      @id, @source_name, @source_url, @license_name, @license_url,
      1, @attribution_required, @attribution_text,
      'verified', datetime('now'), datetime('now'), datetime('now')
    )
  `).run({
    id: sourceId,
    source_name: registered.name || meta.name || sourceId,
    source_url: registered.sourceUrl || meta.sourceUrl || null,
    license_name: license?.label || verification.licenseSpdx,
    license_url: licenseUrlFor(verification.licenseSpdx),
    attribution_required: verification.attributionRequired ? 1 : 0,
    attribution_text: verification.attributionText || null,
  });

  writeAuditLog({
    action: "source_verified",
    entityType: "source",
    entityId: sourceId,
    details: { license: verification.licenseSpdx },
  });

  return { allowed: true, registry: getSourceById(sourceId) };
}

export function getSourceById(id) {
  const db = getIntelligenceDb();
  return db.prepare("SELECT * FROM source_registry WHERE id = ?").get(id) || null;
}

export function listSources(filter = {}) {
  const db = getIntelligenceDb();
  let sql = "SELECT * FROM source_registry WHERE 1=1";
  const params = [];

  if (filter.verificationStatus) {
    sql += " AND verification_status = ?";
    params.push(filter.verificationStatus);
  }
  if (filter.commercialOnly) {
    sql += " AND commercial_use_allowed = 1";
  }

  sql += " ORDER BY source_name";
  return db.prepare(sql).all(...params);
}

function licenseUrlFor(spdx) {
  const urls = {
    "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
    "CC-BY-3.0": "https://creativecommons.org/licenses/by/3.0/",
    "US-GOV": "https://www.usa.gov/government-works",
  };
  return urls[spdx] || null;
}
