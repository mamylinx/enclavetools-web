import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT key, value FROM site_content ORDER BY key').all();
  return successResponse({ content: results });
}, 'Admin content GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const body = await context.request.json();
  const { key, value } = body;
  if (!key || value === undefined) {
    return errorResponse('key and value required', 400);
  }
  await env.enclavetools_db.prepare(
    'INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
  ).bind(key, String(value)).run();
  return successResponse();
}, 'Admin content POST');
