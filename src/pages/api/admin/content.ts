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
    const { results } = await env.enclavetools_db.prepare('SELECT key, value FROM site_content ORDER BY key').all();
    return new Response(JSON.stringify({ content: results }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;
  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const body = await context.request.json();
    const { key, value } = body;
    if (!key || value === undefined) {
      return new Response(JSON.stringify({ error: "key and value required" }), { status: 400 });
    }
    await env.enclavetools_db.prepare(
      'INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
    ).bind(key, String(value)).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
