import type { APIRoute } from 'astro';
export const prerender = false;
import { requireAdminAuth, errorResponse, withErrorHandling } from '../../../../../lib/api-helpers';
import { copyLogo } from '../../../../../lib/r2';

export const POST: APIRoute = withErrorHandling(async (context, env) => {
  const auth = await requireAdminAuth(context);
  if (auth.error) return auth.error;

  const id = context.params.id;
  if (!id) return errorResponse('Missing id', 400);

  if (!env.enclavetools_db) throw new Error("DB not bound");

  const pending = await env.enclavetools_db.prepare('SELECT * FROM pending_tools WHERE id = ?').bind(id).first();
  if (!pending) return errorResponse('Tool not found', 404);

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
}, 'Admin approve');
