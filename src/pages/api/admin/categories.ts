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
    const { results } = await env.enclavetools_db.prepare('SELECT * FROM category_meta ORDER BY sort_order').all();
    return new Response(JSON.stringify({ categories: results }), { status: 200 });
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
    const { category_slug, title, description, icon_name, og_image, sort_order } = body;
    if (!category_slug || !title) {
      return new Response(JSON.stringify({ error: "category_slug and title required" }), { status: 400 });
    }
    await env.enclavetools_db.prepare(
      `INSERT INTO category_meta (category_slug, title, description, icon_name, og_image, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(category_slug) DO UPDATE SET
         title=excluded.title, description=excluded.description, icon_name=excluded.icon_name,
         og_image=excluded.og_image, sort_order=excluded.sort_order, updated_at=datetime('now')`
    ).bind(category_slug, title, description || null, icon_name || null, og_image || null, sort_order || 0).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
