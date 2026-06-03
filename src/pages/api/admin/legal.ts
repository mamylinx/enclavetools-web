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
    const { results } = await env.enclavetools_db.prepare('SELECT * FROM legal_pages ORDER BY slug').all();
    return new Response(JSON.stringify({ pages: results }), { status: 200 });
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
    const { slug, title, body: pageBody } = body;
    if (!slug || !title) {
      return new Response(JSON.stringify({ error: "slug and title required" }), { status: 400 });
    }
    await env.enclavetools_db.prepare(
      `INSERT INTO legal_pages (slug, title, body, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET title=excluded.title, body=excluded.body, updated_at=datetime('now')`
    ).bind(slug, title, pageBody || '').run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
