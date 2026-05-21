/**
 * Uses Cloudflare KV to implement a simple sliding window rate limiter.
 * @param env Cloudflare env object containing RATE_LIMITER binding
 * @param ip The user's IP address
 * @param path The path or action being rate limited
 * @param limit Max requests allowed in the window
 * @param ttlSeconds The window duration in seconds
 * @returns boolean true if allowed, false if rate limited
 */
export async function checkRateLimit(
  env: any,
  ip: string,
  path: string,
  limit: number,
  ttlSeconds: number
): Promise<boolean> {
  if (!env || !env.RATE_LIMITER) {
    console.warn("RATE_LIMITER KV namespace not bound. Bypassing rate limit.");
    return true; // Bypass in local dev if not configured
  }

  const key = `ratelimit:${path}:${ip}`;
  const current = await env.RATE_LIMITER.get(key);
  let count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    return false;
  }
  
  await env.RATE_LIMITER.put(key, (count + 1).toString(), { expirationTtl: ttlSeconds });
  return true;
}
