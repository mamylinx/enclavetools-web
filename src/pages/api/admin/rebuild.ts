import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, errorResponse, withErrorHandling } from '../../../lib/api-helpers';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;

  const hookUrl = (env as Record<string, unknown>).DEPLOY_HOOK_URL as string;
  if (!hookUrl) {
    return errorResponse('DEPLOY_HOOK_URL not configured', 500);
  }

  const res = await fetch(hookUrl, { method: 'POST' });
  if (!res.ok) throw new Error("Failed to trigger deploy");

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}, 'Admin rebuild');
