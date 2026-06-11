import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { checkRateLimit } from '../../lib/rate-limit';
import { submitUrlSchema } from '../../lib/validation';
import { verifyTurnstileToken } from '../../lib/turnstile';

export const POST: APIRoute = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';

  const allowed = await checkRateLimit(env, ip, 'submit', 5, 3600);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
  }

  try {
    const body = await context.request.json();
    const result = submitUrlSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({
        error: "Validation failed",
        details: result.error.errors
      }), { status: 400 });
    }

    const { url, turnstileToken } = result.data;

    const isHuman = await verifyTurnstileToken(env, turnstileToken);
    if (!isHuman) {
      return new Response(JSON.stringify({ error: "Turnstile verification failed" }), { status: 403 });
    }

    const db = env?.enclavetools_db;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not available" }), { status: 500 });
    }

    const normalizedUrl = url.replace(/\/$/, '');

    const existingTool = await db.prepare(
      `SELECT slug FROM tools WHERE url = ? OR github_url = ? LIMIT 1`
    ).bind(normalizedUrl, normalizedUrl).first<{ slug: string }>();

    if (existingTool) {
      return new Response(JSON.stringify({
        status: 'already_listed',
        url: `/tools/${existingTool.slug}`
      }), { status: 200 });
    }

    const existingPending = await db.prepare(
      `SELECT status, explanation FROM pending_tools WHERE url = ? LIMIT 1`
    ).bind(normalizedUrl).first<{ status: string; explanation: string | null }>();

    if (existingPending) {
      if (existingPending.status === 'approved') {
        return new Response(JSON.stringify({ status: 'already_approved' }), { status: 200 });
      }
      if (existingPending.status === 'pending') {
        return new Response(JSON.stringify({ status: 'already_pending' }), { status: 200 });
      }
      if (existingPending.status === 'rejected') {
        return new Response(JSON.stringify({
          status: 'previously_rejected',
          explanation: existingPending.explanation || null
        }), { status: 200 });
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO pending_tools (id, url, status, submitted_at) VALUES (?, ?, 'pending', ?)`
    ).bind(id, normalizedUrl, now).run();

    return new Response(JSON.stringify({ status: 'success', id }), { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Submission error:", message);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
