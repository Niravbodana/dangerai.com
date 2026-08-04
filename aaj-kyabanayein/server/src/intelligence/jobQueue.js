/**
 * Resumable background job queue — SQLite-backed with optional Redis.
 */
import crypto from "crypto";
import { getIntelligenceDb } from "./repository.js";
import { writeAuditLog } from "./auditLog.js";

export function enqueueJob(jobType, payload = {}, opts = {}) {
  const db = getIntelligenceDb();
  const id = opts.id || `job-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const maxAttempts = opts.maxAttempts || 3;

  db.prepare(`
    INSERT INTO job_queue (id, job_type, payload_json, max_attempts, scheduled_at)
    VALUES (@id, @job_type, @payload_json, @max_attempts, datetime('now'))
  `).run({
    id,
    job_type: jobType,
    payload_json: JSON.stringify(payload),
    max_attempts: maxAttempts,
  });

  writeAuditLog({ action: "job_enqueued", entityType: "job", entityId: id, details: { jobType } });
  return id;
}

export function claimNextJob(jobTypes = null) {
  const db = getIntelligenceDb();
  let sql = `
    SELECT * FROM job_queue
    WHERE status = 'pending' AND scheduled_at <= datetime('now')
  `;
  const params = [];

  if (jobTypes?.length) {
    sql += ` AND job_type IN (${jobTypes.map(() => "?").join(",")})`;
    params.push(...jobTypes);
  }

  sql += " ORDER BY scheduled_at ASC LIMIT 1";

  const job = db.prepare(sql).get(...params);
  if (!job) return null;

  db.prepare(`
    UPDATE job_queue SET status = 'processing', started_at = datetime('now'), attempts = attempts + 1
    WHERE id = ? AND status = 'pending'
  `).run(job.id);

  return parseJob(job);
}

export function completeJob(jobId, result = null) {
  const db = getIntelligenceDb();
  db.prepare(`
    UPDATE job_queue SET status = 'completed', finished_at = datetime('now'), error = NULL
    WHERE id = ?
  `).run(jobId);
  writeAuditLog({ action: "job_completed", entityType: "job", entityId: jobId, details: result });
}

export function failJob(jobId, error, retryDelayMs = 5000) {
  const db = getIntelligenceDb();
  const job = db.prepare("SELECT * FROM job_queue WHERE id = ?").get(jobId);
  if (!job) return;

  if (job.attempts >= job.max_attempts) {
    db.prepare(`
      UPDATE job_queue SET status = 'dead', finished_at = datetime('now'), error = ?
      WHERE id = ?
    `).run(error, jobId);
    writeAuditLog({ action: "job_dead", entityType: "job", entityId: jobId, details: { error } });
    return;
  }

  const retryAt = new Date(Date.now() + retryDelayMs * job.attempts).toISOString();
  db.prepare(`
    UPDATE job_queue SET status = 'pending', error = ?, scheduled_at = ?
    WHERE id = ?
  `).run(error, retryAt, jobId);
}

export function getQueueStats() {
  const db = getIntelligenceDb();
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count FROM job_queue GROUP BY status
  `).all();
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

export function listJobs({ status = null, limit = 50 } = {}) {
  const db = getIntelligenceDb();
  let sql = "SELECT * FROM job_queue";
  const params = [];
  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  return db.prepare(sql).all(...params).map(parseJob);
}

function parseJob(row) {
  return {
    ...row,
    payload: row.payload_json ? JSON.parse(row.payload_json) : {},
  };
}

/**
 * Process one job from queue (call from worker loop).
 */
export async function processOneJob(handlers = {}) {
  const job = claimNextJob(Object.keys(handlers));
  if (!job) return null;

  const handler = handlers[job.job_type];
  if (!handler) {
    failJob(job.id, `No handler for job type: ${job.job_type}`);
    return job;
  }

  try {
    const result = await handler(job.payload, job);
    completeJob(job.id, result);
    return { ...job, result, status: "completed" };
  } catch (err) {
    failJob(job.id, err.message);
    return { ...job, error: err.message, status: "failed" };
  }
}
