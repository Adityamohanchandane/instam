/**
 * Simple retry with exponential backoff for server-side HTTP calls.
 */

export async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelay ?? 800;
  const maxDelay = options.maxDelay ?? 15000;
  const multiplier = options.backoffMultiplier ?? 2;
  const shouldRetry =
    options.shouldRetry ??
    ((err) => {
      const status = err?.response?.status;
      if (status === 429 || (status >= 500 && status < 600)) return true;
      const code = err?.code;
      return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(code);
    });

  let delay = initialDelay;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !shouldRetry(error)) throw error;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * multiplier, maxDelay);
    }
  }

  throw lastError;
}
