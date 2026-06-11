import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, withErrorHandling } from '../../../../../lib/api-helpers';
import { deleteLogo } from '../../../../../lib/r2';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;

  const id = context.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  if (!env.enclavetools_db) throw new Error("DB not bound");

  const pending = await env.enclavetools_db.prepare('SELECT logo_r2_key FROM pending_tools WHERE id = ?').bind(id).first();

  if (pending?.logo_r2_key) {
    await deleteLogo(env, pending.logo_r2_key);
  }

  const now = new Date().toISOString();

  await env.enclavetools_db.prepare(`UPDATE pending_tools SET status = 'rejected', reviewed_at = ? WHERE id = ?`)
    .bind(now, id).run();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin reject');
