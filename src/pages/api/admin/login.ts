// src/pages/api/admin/login.ts
import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { verifyPassword, createSessionToken } from '../../../lib/auth';

export const POST: APIRoute = async (context) => {
  
  try {
    const data = await context.request.json();
    if (!data.password) {
      return new Response(JSON.stringify({ error: "Password required" }), { status: 400 });
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
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
};
