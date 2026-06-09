// src/pages/api/admin/list.ts
import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { verifySessionToken } from '../../../lib/auth';

export const GET: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;
  
  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    if (!env.enclavetools_db) throw new Error("DB not bound");

    const result = await env.enclavetools_db.prepare(`
      SELECT * FROM pending_tools 
      WHERE status = 'pending' 
      ORDER BY submitted_at DESC
    `).all();

    return new Response(JSON.stringify({ tools: result.results }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("Admin list error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
