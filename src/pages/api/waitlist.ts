import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { checkRateLimit } from '../../lib/rate-limit';
import { sendTelegramMessage } from '../../lib/telegram';

export const POST: APIRoute = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';

  const allowed = await checkRateLimit(env, ip, 'waitlist', 3, 3600);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429 });
  }

  try {
    const body = await context.request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), { status: 400 });
    }

    if (!env || !env.enclavetools_db) {
      console.warn("D1 database not bound.");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 503 });
    }

    const existing = await env.enclavetools_db
      .prepare("SELECT id FROM waitlist WHERE email = ?")
      .bind(normalizedEmail)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ status: "already_registered" }), { status: 200 });
    }

    await env.enclavetools_db
      .prepare("INSERT INTO waitlist (email, source) VALUES (?, 'benchmark-waitlist')")
      .bind(normalizedEmail)
      .run();

    const message = `
<b>New Waitlist Signup</b> 📋
<b>Email:</b> ${normalizedEmail}
<b>Source:</b> benchmark-waitlist
    `.trim();

    const telegramPromise = sendTelegramMessage(env, message);

    const runtime = context.locals?.runtime;
    if (runtime && typeof runtime.waitUntil === 'function') {
      runtime.waitUntil(telegramPromise);
    } else {
      await telegramPromise;
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (err) {
    console.error("Waitlist signup error:", err);
    return new Response(JSON.stringify({ error: "Failed to register email" }), { status: 500 });
  }
};
