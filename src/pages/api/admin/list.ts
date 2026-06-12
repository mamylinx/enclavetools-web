import type { APIRoute } from 'astro';
export const prerender = false;
import { successResponse, withErrorHandling } from '../../../lib/api-helpers';

export const GET: APIRoute = withErrorHandling(async (context, env) => {
  if (!env.enclavetools_db) throw new Error("DB not bound");
  const result = await env.enclavetools_db.prepare(`
    SELECT * FROM pending_tools 
    WHERE status IN ('pending', 'approved', 'rejected')
    ORDER BY submitted_at DESC
    LIMIT 100
  `).all();
  return successResponse({ tools: result.results });
}, 'Admin list');
