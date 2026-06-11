import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';

export const GET: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT id, label, field_key, sort_order FROM compare_rows ORDER BY sort_order ASC').all();
  return successResponse({ rows: results });
}, 'Admin compare-rows GET');

export const POST: APIRoute = withErrorHandling(async (_context, env) => {
  const auth = await requireAdminAuth(_context);
  if (auth.error) return auth.error;
  const body = await _context.request.json();
  const { id, label, field_key, sort_order } = body;
  if (!label || !field_key) return errorResponse('label and field_key required', 400);
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
  const url = new URL(_context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return errorResponse('id required', 400);
  await env.enclavetools_db.prepare('DELETE FROM compare_rows WHERE id = ?').bind(id).run();
  return successResponse();
}, 'Admin compare-rows DELETE');
