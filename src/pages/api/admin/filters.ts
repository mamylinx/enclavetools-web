import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { filterOptionSchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT * FROM filter_options ORDER BY group_key, sort_order').all();
  return successResponse({ options: results });
}, 'Admin filters GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-filters', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await context.request.json();
  const parsed = filterOptionSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { id, group_key, value, label, sort_order, active } = parsed.data;
  if (id) {
    await env.enclavetools_db.prepare(
      `UPDATE filter_options SET group_key=?, value=?, label=?, sort_order=?, active=?, updated_at=datetime('now') WHERE id=?`
    ).bind(group_key, value, label, sort_order || 0, active ?? 1, id).run();
  } else {
    await env.enclavetools_db.prepare(
      `INSERT INTO filter_options (group_key, value, label, sort_order, active) VALUES (?, ?, ?, ?, ?)`
    ).bind(group_key, value, label, sort_order || 0, active ?? 1).run();
  }
  return successResponse();
}, 'Admin filters POST');

export const DELETE: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-filters', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return errorResponse('id required', 400);
  await env.enclavetools_db.prepare('DELETE FROM filter_options WHERE id = ?').bind(id).run();
  return successResponse();
}, 'Admin filters DELETE');
