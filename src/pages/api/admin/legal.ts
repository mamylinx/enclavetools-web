import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT * FROM legal_pages ORDER BY slug').all();
  return successResponse({ pages: results });
}, 'Admin legal GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const body = await context.request.json();
  const { slug, title, body: pageBody } = body;
  if (!slug || !title) {
    return errorResponse('slug and title required', 400);
  }
  await env.enclavetools_db.prepare(
    `INSERT INTO legal_pages (slug, title, body, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET title=excluded.title, body=excluded.body, updated_at=datetime('now')`
  ).bind(slug, title, pageBody || '').run();
  return successResponse();
}, 'Admin legal POST');
