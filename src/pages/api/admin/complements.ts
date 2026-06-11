import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { complementSchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT category_slug, complements FROM complements ORDER BY category_slug').all();
  return successResponse({ complements: results });
}, 'Admin complements GET');

export const POST: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(_context);
  if (csrf.error) return csrf.error;
  const ip = _context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-complements', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await _context.request.json();
  const parsed = complementSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { category_slug, complements } = parsed.data;
  await env.enclavetools_db.prepare(
    `INSERT INTO complements (category_slug, complements, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(category_slug) DO UPDATE SET complements = ?, updated_at = datetime('now')`
  ).bind(category_slug, JSON.stringify(complements), JSON.stringify(complements)).run();
  return successResponse();
}, 'Admin complements POST');

export const DELETE: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(_context);
  if (csrf.error) return csrf.error;
  const ip = _context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-complements', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const url = new URL(_context.request.url);
  const category_slug = url.searchParams.get('category_slug');
  if (!category_slug) return errorResponse('category_slug required', 400);
  await env.enclavetools_db.prepare('DELETE FROM complements WHERE category_slug = ?').bind(category_slug).run();
  return successResponse();
}, 'Admin complements DELETE');
