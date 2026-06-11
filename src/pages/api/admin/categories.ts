import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, successResponse, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { requireCsrfValidation } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
import { categorySchema } from '../../../lib/admin-schemas';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const { results } = await env.enclavetools_db.prepare('SELECT * FROM category_meta ORDER BY sort_order').all();
  return successResponse({ categories: results });
}, 'Admin categories GET');

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;
  const csrf = await requireCsrfValidation(context);
  if (csrf.error) return csrf.error;
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-categories', 30, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);
  const body = await context.request.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid input', 400, parsed.error.flatten());
  const { category_slug, title, description, icon_name, og_image, sort_order } = parsed.data;
  await env.enclavetools_db.prepare(
    `INSERT INTO category_meta (category_slug, title, description, icon_name, og_image, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(category_slug) DO UPDATE SET
       title=excluded.title, description=excluded.description, icon_name=excluded.icon_name,
       og_image=excluded.og_image, sort_order=excluded.sort_order, updated_at=datetime('now')`
  ).bind(category_slug, title, description || null, icon_name || null, og_image || null, sort_order || 0).run();
  return successResponse();
}, 'Admin categories POST');
