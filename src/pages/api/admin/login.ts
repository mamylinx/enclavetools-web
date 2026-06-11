import type { APIRoute } from 'astro';
export const prerender = false;
import { errorResponse, withErrorHandling } from '../../../lib/api-helpers';
import { verifyPassword, createSessionToken } from '../../../lib/auth';
import { checkRateLimit } from '../../../lib/rate-limit';
import { createCsrfToken } from '../../../lib/csrf';
import { adminLoginSchema } from '../../../lib/validation';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const allowed = await checkRateLimit(env, ip, 'admin-login', 5, 900);
  if (!allowed) {
    return errorResponse('Too many attempts', 429);
  }

  const data = await context.request.json();
  const parsed = adminLoginSchema.safeParse(data);
  if (!parsed.success) {
    return errorResponse('Invalid password format', 400);
  }

  const isValid = await verifyPassword(env, data.password);
  if (!isValid) {
    return errorResponse('Invalid password', 401);
  }

  const token = await createSessionToken(env);
  await createCsrfToken(env, context);

  const isSecure = new URL(context.request.url).protocol === 'https:';
  context.cookies.set('admin_session', token, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin login');
