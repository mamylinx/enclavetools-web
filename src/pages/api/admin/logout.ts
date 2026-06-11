import type { APIRoute } from 'astro';
import { requireAdminAuth, errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { deleteCsrfToken } from '../../../lib/csrf';
import { checkRateLimit } from '../../../lib/rate-limit';
export const prerender = false;

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;

  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-logout', 10, 60);
  if (!allowed) return errorResponse('Rate limit exceeded', 429);

  context.cookies.delete('admin_session', { path: '/' });
  deleteCsrfToken(context);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin logout');
