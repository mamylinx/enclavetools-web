import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { legalPageSchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT * FROM legal_pages ORDER BY slug').all();
  return successResponse({ pages: results });
}, 'Admin legal GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-legal', 10, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await context.request.json();
  const parsed = legalPageSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { slug, title, body: pageBody } = parsed.data;
  await env.enclavetools_db.prepare(
    `INSERT INTO legal_pages (slug, title, body, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET title=excluded.title, body=excluded.body, updated_at=datetime('now')`
  ).bind(slug, title, pageBody || '').run();
  return successResponse();
}, 'Admin legal POST');
