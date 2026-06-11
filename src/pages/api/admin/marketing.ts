import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { marketingCardSchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT * FROM marketing_cards ORDER BY type, sort_order').all();
  return successResponse({ cards: results });
}, 'Admin marketing GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-marketing', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await context.request.json();
  const parsed = marketingCardSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { id, type, label, title, description, cta, url, logo, sort_order, active } = parsed.data;
  if (id) {
    await env.enclavetools_db.prepare(
      `UPDATE marketing_cards SET type=?, label=?, title=?, description=?, cta=?, url=?, logo=?, sort_order=?, active=?, updated_at=datetime('now') WHERE id=?`
    ).bind(type, label || null, title, description, cta || null, url || null, logo || null, sort_order || 0, active ?? 1, id).run();
  } else {
    await env.enclavetools_db.prepare(
      `INSERT INTO marketing_cards (type, label, title, description, cta, url, logo, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(type, label || null, title, description, cta || null, url || null, logo || null, sort_order || 0, active ?? 1).run();
  }
  return successResponse();
}, 'Admin marketing POST');

export const DELETE: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-marketing', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return errorResponse('id required', 400);
  await env.enclavetools_db.prepare('DELETE FROM marketing_cards WHERE id = ?').bind(id).run();
  return successResponse();
}, 'Admin marketing DELETE');
