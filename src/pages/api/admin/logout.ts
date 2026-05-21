// src/pages/api/admin/logout.ts
import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  context.cookies.delete('admin_session', { path: '/' });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
