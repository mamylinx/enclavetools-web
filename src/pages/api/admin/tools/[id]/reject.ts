import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, errorResponse, withErrorHandling } from '../../../../../lib/api-helpers';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;

  const id = context.params.id;
  if (!id) return errorResponse('Missing id', 400);

  if (!env.enclavetools_db) throw new Error("DB not bound");

  let explanation: string | null = null;
  try {
    const body = await context.request.json();
    explanation = body?.explanation || null;
  } catch {}

  const now = new Date().toISOString();

  await env.enclavetools_db.prepare(
    `UPDATE pending_tools SET status = 'rejected', reviewed_at = ?, explanation = ? WHERE id = ?`
  ).bind(now, explanation, id).run();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin reject');
