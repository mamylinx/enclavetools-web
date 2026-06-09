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
    const { results } = await env.enclavetools_db.prepare('SELECT * FROM filter_options ORDER BY group_key, sort_order').all();
    return new Response(JSON.stringify({ options: results }), { status: 200 });
  } catch (err: any) {
    console.error("Admin filters GET error", err);
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
    const { id, group_key, value, label, sort_order, active } = body;
    if (id) {
      await env.enclavetools_db.prepare(
        `UPDATE filter_options SET group_key=?, value=?, label=?, sort_order=?, active=?, updated_at=datetime('now') WHERE id=?`
      ).bind(group_key, value, label, sort_order || 0, active ?? 1, id).run();
    } else {
      await env.enclavetools_db.prepare(
        `INSERT INTO filter_options (group_key, value, label, sort_order, active) VALUES (?, ?, ?, ?, ?)`
      ).bind(group_key, value, label, sort_order || 0, active ?? 1).run();
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Admin filters POST error", err);
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
    await env.enclavetools_db.prepare('DELETE FROM filter_options WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Admin filters DELETE error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
