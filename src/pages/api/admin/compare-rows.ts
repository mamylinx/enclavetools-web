import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { compareRowSchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT id, label, field_key, sort_order FROM compare_rows ORDER BY sort_order ASC').all();
  return successResponse({ rows: results });
}, 'Admin compare-rows GET');

export const POST: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(_context);
  if (csrf.error) return csrf.error;
  const ip = _context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-compare-rows', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await _context.request.json();
  const parsed = compareRowSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { id, label, field_key, sort_order } = parsed.data;
  if (id) {
    await env.enclavetools_db.prepare(
      `UPDATE compare_rows SET label=?, field_key=?, sort_order=?, updated_at=datetime('now') WHERE id=?`
    ).bind(label, field_key, sort_order || 0, id).run();
  } else {
    await env.enclavetools_db.prepare(
      `INSERT INTO compare_rows (label, field_key, sort_order) VALUES (?, ?, ?)`
    ).bind(label, field_key, sort_order || 0).run();
  }
  return successResponse();
}, 'Admin compare-rows POST');

export const DELETE: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(_context);
  if (csrf.error) return csrf.error;
  const ip = _context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-compare-rows', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const url = new URL(_context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return errorResponse('id required', 400);
  await env.enclavetools_db.prepare('DELETE FROM compare_rows WHERE id = ?').bind(id).run();
  return successResponse();
}, 'Admin compare-rows DELETE');
