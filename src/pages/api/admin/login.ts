// src/pages/api/admin/login.ts
import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { verifyPassword, createSessionToken } from '../../../lib/auth';
import { checkRateLimit } from '../../../lib/rate-limit';
import { adminLoginSchema } from '../../../lib/validation';

export const POST: APIRoute = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-login', 5, 900);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many attempts" }), { status: 429 });
  }

  try {
    const data = await context.request.json();
    const parsed = adminLoginSchema.safeParse(data);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid password format" }), { status: 400 });
    }

    const isValid = await verifyPassword(env, data.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
    }

    const token = await createSessionToken(env);
    
    // Set HTTP-only cookie
    const isSecure = new URL(context.request.url).protocol === 'https:';
    context.cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'strict' : 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Admin login error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
