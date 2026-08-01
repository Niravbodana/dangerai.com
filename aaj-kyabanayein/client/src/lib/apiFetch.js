/** Shared fetch wrapper — timeout, retry, structured errors (no external deps). */

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

function isRetryableError(err) {
  if (!err) return false;
  if (err.name === "AbortError" || err.name === "TimeoutError") return true;
  return err instanceof TypeError;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} url
 * @param {RequestInit & { timeout?: number; retries?: number }} options
 */
export async function apiFetch(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, retries = 1, ...fetchOpts } = options;
  const attempts = Math.max(0, retries) + 1;
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        signal: AbortSignal.timeout(timeout),
      });

      if (RETRYABLE_STATUS.has(res.status) && attempt < attempts - 1) {
        await delay(300 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (isRetryableError(err) && attempt < attempts - 1) {
        await delay(300 * (attempt + 1));
        continue;
      }
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        throw new ApiError("Request timed out. Check your connection.", { code: "TIMEOUT" });
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new ApiError("You appear to be offline.", { code: "OFFLINE" });
      }
      throw new ApiError(err.message || "Network error", { code: "NETWORK" });
    }
  }

  throw lastError || new ApiError("Request failed", { code: "NETWORK" });
}

export async function parseJsonResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new ApiError("Request failed", { status: res.status });
    throw new ApiError("Invalid response from server", { status: res.status });
  }
  if (!res.ok) {
    throw new ApiError(data.message || data.error || "Request failed", {
      status: res.status,
      data,
    });
  }
  return data;
}
