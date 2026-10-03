import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { checkRateLimit } from '../../lib/rate-limit';
import { sendTelegramMessage } from '../../lib/telegram';

export const POST: APIRoute = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  
  const allowed = await checkRateLimit(env, ip, 'contact', 5, 3600);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429 });
  }

  try {
    const body = await context.request.json();
    const { name, company, email, subject, text } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const message = `
<b>New Contact / Audit Request</b> 🛡️
<b>Name:</b> ${name}
<b>Company:</b> ${company || 'N/A'}
<b>Email:</b> ${email}
<b>Subject:</b> ${subject || 'None'}
<pre>${text || 'No message provided'}</pre>
    `.trim();

    // Best-effort D1 persistence for rpaudit early-access signups.
    // Reuses the existing `waitlist` table (see wrangler/d1/migrations/
    // 004_create_waitlist_table.sql) — no new migration needed. Regular
    // contact messages are Telegram-only, as before.
    const earlyAccessMatch = typeof subject === 'string'
      ? /rpaudit early access \((\w+)\)/i.exec(subject)
      : null;
    if (earlyAccessMatch && typeof email === 'string') {
      const normalized = email.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        const source = `rpaudit-early-access-${earlyAccessMatch[1].toLowerCase()}`;
        try {
          const db = (env as any)?.enclavetools_db;
          if (db) {
            await db
              .prepare("INSERT OR IGNORE INTO waitlist (email, source) VALUES (?, ?)")
              .bind(normalized, source)
              .run();
          } else {
            console.warn("D1 database not bound; skipping waitlist insert.");
          }
        } catch (dbErr) {
          console.error("Waitlist insert error (non-fatal):", dbErr);
        }
      }
    }

    const telegramPromise = sendTelegramMessage(env, message);

    // waitUntil is only available in the Cloudflare Workers runtime, not in local Vite dev
    const runtime = context.locals?.runtime;
    if (runtime && typeof runtime.waitUntil === 'function') {
      runtime.waitUntil(telegramPromise);
    } else {
      await telegramPromise;
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (err) {
    console.error("Contact form error:", err);
    return new Response(JSON.stringify({ error: "Invalid request payload" }), { status: 400 });
  }
};
