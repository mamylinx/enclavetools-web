import type { APIRoute } from 'astro';
export const prerender = false;
import { errorResponse, withErrorHandling } from '../../../../../lib/api-helpers';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { toolRejectSchema } from '../../../../../lib/admin-schemas';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-reject', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);

  const id = context.params.id;
  if (!id) return errorResponse('Missing id', 400);

  if (!env.enclavetools_db) throw new Error("DB not bound");

  let explanation: string | null = null;
  try {
    const body = await context.request.json();
    const parsed = toolRejectSchema.safeParse(body);
    if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
    explanation = parsed.data.explanation || null;
  } catch {}

  const now = new Date().toISOString();

  await env.enclavetools_db.prepare(
    `UPDATE pending_tools SET status = 'rejected', reviewed_at = ?, explanation = ? WHERE id = ?`
  ).bind(now, explanation, id).run();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin reject');
