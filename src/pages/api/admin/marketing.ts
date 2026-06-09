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
    const { results } = await env.enclavetools_db.prepare('SELECT * FROM marketing_cards ORDER BY type, sort_order').all();
    return new Response(JSON.stringify({ cards: results }), { status: 200 });
  } catch (err: any) {
    console.error("Admin marketing GET error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};

export const POST: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;
  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const body = await context.request.json();
    const { id, type, label, title, description, cta, url, logo, sort_order, active } = body;
    if (id) {
      await env.enclavetools_db.prepare(
        `UPDATE marketing_cards SET type=?, label=?, title=?, description=?, cta=?, url=?, logo=?, sort_order=?, active=?, updated_at=datetime('now') WHERE id=?`
      ).bind(type, label || null, title, description, cta || null, url || null, logo || null, sort_order || 0, active ?? 1, id).run();
    } else {
      await env.enclavetools_db.prepare(
        `INSERT INTO marketing_cards (type, label, title, description, cta, url, logo, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(type, label || null, title, description, cta || null, url || null, logo || null, sort_order || 0, active ?? 1).run();
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Admin marketing POST error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;
  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    await env.enclavetools_db.prepare('DELETE FROM marketing_cards WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Admin marketing DELETE error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
