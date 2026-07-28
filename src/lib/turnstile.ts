import type { CloudflareEnv } from '../interfaces/env';

/** Verifies a Turnstile token via the configured Turnstile worker endpoint. */
export async function verifyTurnstileToken(
  env: CloudflareEnv,
  token: string
): Promise<boolean> {
  if (!token) return false;
  if (!env.TURNSTILE_WORKER_URL) {
    console.warn("TURNSTILE_WORKER_URL is not configured.");
    return false;
  }

  try {
    const res = await fetch(env.TURNSTILE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    if (!res.ok) {
      console.error("Turnstile worker returned non-ok status:", res.status);
      return false;
    }

    const data = await res.json() as { success?: boolean };
    return !!data.success;
  } catch (err) {
    console.error("Error communicating with Turnstile worker:", err);
    return false;
  }
}
