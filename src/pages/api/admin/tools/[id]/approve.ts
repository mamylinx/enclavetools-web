import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySessionToken } from '../../../../../lib/auth';
import { copyLogo } from '../../../../../lib/r2';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const token = context.cookies.get('admin_session')?.value;

  if (!token || !(await verifySessionToken(env, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const id = context.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  try {
    if (!env.enclavetools_db) throw new Error("DB not bound");

    const pending = await env.enclavetools_db.prepare('SELECT * FROM pending_tools WHERE id = ?').bind(id).first();
    if (!pending) return new Response(JSON.stringify({ error: "Tool not found" }), { status: 404 });

    if (pending.logo_r2_key) {
      const destKey = `approved/${pending.slug}.png`;
      await copyLogo(env, pending.logo_r2_key, destKey);
    }

    const now = new Date().toISOString();

    await env.enclavetools_db.prepare(`
      INSERT INTO tools (
        id, name, slug, description, url, github_url, category, license,
        language, hardware, deployment, model_format, maturity, featured,
        popularity_score, date_added, last_updated, logo_source, created_at,
        plain_description, technical_description, commercial_use, setup_difficulty,
        use_cases, personas, features, works_with, docs_url,
        community_guides, community_notes, min_ram_gb, recommended_ram_gb,
        telemetry, offline_after_setup, paid_support, gui_available,
        docker_available, openai_api, rest_api, fine_tuning, quantization,
        community_notes_count, community_guides_count, last_verified
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `).bind(
      pending.id, pending.name, pending.slug, pending.description, pending.url, pending.github_url,
      pending.category, pending.license, pending.language, pending.hardware, pending.deployment,
      pending.model_format, pending.maturity, pending.popularity_score, pending.date_added,
      now.split('T')[0], pending.logo_source, now,
      pending.plain_description, pending.technical_description, pending.commercial_use, pending.setup_difficulty,
      pending.use_cases, pending.personas, pending.features, pending.works_with, pending.docs_url,
      pending.community_guides, pending.community_notes, pending.min_ram_gb, pending.recommended_ram_gb,
      pending.telemetry, pending.offline_after_setup, pending.paid_support, pending.gui_available,
      pending.docker_available, pending.openai_api, pending.rest_api, pending.fine_tuning, pending.quantization,
      pending.community_notes_count, pending.community_guides_count, pending.last_verified
    ).run();

    await env.enclavetools_db.prepare(`DELETE FROM pending_tools WHERE id = ?`)
      .bind(id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Approve error", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
