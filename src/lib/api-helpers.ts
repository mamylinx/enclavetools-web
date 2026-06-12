import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import type { CloudflareEnv } from '../interfaces/env';

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  details?: unknown;
  data?: T;
}

export function jsonResponse<T>(data: ApiResponse<T>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function successResponse<T extends Record<string, unknown> = Record<string, unknown>>(data?: T): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error: string, status: number, details?: unknown): Response {
  return jsonResponse({ error, details }, status);
}

/**
 * Wrap an API handler with try/catch and typed error handling.
 */
export function withErrorHandling(
  handler: (context: APIContext, env: CloudflareEnv) => Promise<Response>,
  label: string,
): (context: APIContext) => Promise<Response> {
  return async (context) => {
    const e = env as CloudflareEnv;
    try {
      return await handler(context, e);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${label}:`, message);
      return errorResponse('Internal server error', 500);
    }
  };
}
