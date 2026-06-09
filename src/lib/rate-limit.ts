/**
 * Uses Cloudflare KV to implement a simple sliding window rate limiter.
 */
export async function checkRateLimit(
  env: any,
  ip: string,
  path: string,
  limit: number,
  ttlSeconds: number
): Promise<boolean> {
  if (!env || !env.RATE_LIMITER) {
    console.warn("RATE_LIMITER KV namespace not bound. Denying request by default.");
    return false;
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
