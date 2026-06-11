import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';

export const GET: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT category_slug, complements FROM complements ORDER BY category_slug').all();
  return successResponse({ complements: results });
}, 'Admin complements GET');

export const POST: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const body = await _context.request.json();
  const { category_slug, complements } = body;
  if (!category_slug || !complements) return errorResponse('category_slug and complements required', 400);
  await env.enclavetools_db.prepare(
    `INSERT INTO complements (category_slug, complements, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(category_slug) DO UPDATE SET complements = ?, updated_at = datetime('now')`
  ).bind(category_slug, JSON.stringify(complements), JSON.stringify(complements)).run();
  return successResponse();
}, 'Admin complements POST');

export const DELETE: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const url = new URL(_context.request.url);
  const category_slug = url.searchParams.get('category_slug');
  if (!category_slug) return errorResponse('category_slug required', 400);
  await env.enclavetools_db.prepare('DELETE FROM complements WHERE category_slug = ?').bind(category_slug).run();
  return successResponse();
}, 'Admin complements DELETE');
