import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { contentUpdateSchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT key, value FROM site_content ORDER BY key').all();
  return successResponse({ content: results });
}, 'Admin content GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-content', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await context.request.json();
  const parsed = contentUpdateSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { key, value } = parsed.data;
  await env.enclavetools_db.prepare(
    'INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
  ).bind(key, String(value)).run();
  return successResponse();
}, 'Admin content POST');
