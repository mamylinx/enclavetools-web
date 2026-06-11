import type { APIContext } from 'astro';
import type { CloudflareEnv } from '../interfaces/env';

function requireSecret(env: CloudflareEnv): string {
  if (!env.ADMIN_SECRET) throw new Error("ADMIN_SECRET env var is not set");
  return env.ADMIN_SECRET;
}

export async function createCsrfToken(env: CloudflareEnv, context: APIContext): Promise<void> {
  const secret = requireSecret(env);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const raw = crypto.getRandomValues(new Uint8Array(32));
  const rawBase64 = btoa(String.fromCharCode(...raw));
  const signature = await crypto.subtle.sign('HMAC', key, raw);
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const token = `${rawBase64}.${sigBase64}`;

  const isSecure = new URL(context.request.url).protocol === 'https:';
  context.cookies.set(isSecure ? '__Host-csrf' : 'csrf', token, {
    path: '/',
    secure: isSecure,
    sameSite: 'strict',
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });
}

export function deleteCsrfToken(context: APIContext): void {
  context.cookies.delete('__Host-csrf', { path: '/' });
  context.cookies.delete('csrf', { path: '/' });
}

export async function requireCsrfValidation(
  context: APIContext,
): Promise<{ ok: true } | { ok: false; error: Response }> {
  const cookieVal =
    context.cookies.get('__Host-csrf')?.value ||
    context.cookies.get('csrf')?.value;
  const headerVal = context.request.headers.get('X-CSRF-Token');

  if (!cookieVal || !headerVal) {
    return { ok: false, error: new Response(JSON.stringify({ error: 'CSRF validation failed' }), { status: 403, headers: { 'Content-Type': 'application/json' } }) };
  }

  const a = new TextEncoder().encode(cookieVal);
  const b = new TextEncoder().encode(headerVal);

  if (a.length !== b.length) {
    return { ok: false, error: new Response(JSON.stringify({ error: 'CSRF validation failed' }), { status: 403, headers: { 'Content-Type': 'application/json' } }) };
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  if (result !== 0) {
    return { ok: false, error: new Response(JSON.stringify({ error: 'CSRF validation failed' }), { status: 403, headers: { 'Content-Type': 'application/json' } }) };
  }

  return { ok: true };
}
