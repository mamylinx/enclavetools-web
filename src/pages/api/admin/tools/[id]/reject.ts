// src/pages/api/admin/tools/[id]/reject.ts
import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { verifySessionToken } from '../../../../../lib/auth';
import { deleteLogo } from '../../../../../lib/r2';

export const POST: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;
  
  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const id = context.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  try {
    if (!env.enclavetools_db) throw new Error("DB not bound");

    // Fetch the pending tool to see if it has a logo
    const pending = await env.enclavetools_db.prepare('SELECT logo_r2_key FROM pending_tools WHERE id = ?').bind(id).first();
    
    // Delete logo if it exists
    if (pending?.logo_r2_key) {
      await deleteLogo(env, pending.logo_r2_key);
    }

    const now = new Date().toISOString();

    // Update pending status
    await env.enclavetools_db.prepare(`UPDATE pending_tools SET status = 'rejected', reviewed_at = ? WHERE id = ?`)
      .bind(now, id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Reject error", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
