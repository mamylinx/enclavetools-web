// src/pages/api/admin/rebuild.ts
import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { verifySessionToken } from '../../../lib/auth';

export const POST: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;
  
  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Use Deploy Hook URL
  const hookUrl = env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return new Response(JSON.stringify({ error: "DEPLOY_HOOK_URL not configured" }), { status: 500 });
  }

  try {
    const res = await fetch(hookUrl, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to trigger deploy");
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
