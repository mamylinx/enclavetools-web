import type { APIRoute } from 'astro';
export const prerender = false;
import { errorResponse, withErrorHandling } from '../../../../../lib/api-helpers';
import { checkRateLimit } from '../../../../../lib/rate-limit';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-approve', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);

  const id = context.params.id;
  if (!id) return errorResponse('Missing id', 400);

  if (!env.enclavetools_db) throw new Error("DB not bound");

  const now = new Date().toISOString();

  await env.enclavetools_db.prepare(
    `UPDATE pending_tools SET status = 'approved', reviewed_at = ? WHERE id = ?`
  ).bind(now, id).run();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin approve');
