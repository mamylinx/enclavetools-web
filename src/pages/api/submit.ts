import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { checkRateLimit } from '../../lib/rate-limit';
import { submitFormSchema } from '../../lib/validation';
import { uploadLogo } from '../../lib/r2';

export const POST: APIRoute = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  
  // Rate limit: 10 submissions per IP per 30 minutes
  const allowed = await checkRateLimit(env, ip, 'submit', 10, 1800);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
  }

  try {
    const formData = await context.request.formData();
    const dataObj = Object.fromEntries(formData.entries());
    
    // Validate with Zod
    const result = submitFormSchema.safeParse(dataObj);
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: result.error.errors 
      }), { status: 400 });
    }

    const val = result.data;

    console.log("Received submission:", val);
    
    // Generate an ID and slug
    const id = crypto.randomUUID();
    const rawSlug = val.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${rawSlug}-${id.split('-')[0]}`; // Ensure uniqueness
    
    const githubDataStr = formData.get('github_data') as string;
    let ghData: any = null;
    let popularity_score = 0;
    let ghLanguage: string | null = null;
    
    if (githubDataStr) {
      try {
        ghData = JSON.parse(githubDataStr);
        popularity_score = ghData.stargazers_count || ghData.stars || 0;
        if (ghData.language) {
          ghLanguage = JSON.stringify([ghData.language]);
        }
      } catch (e) {}
    }

    // Handle logo upload
    let logo_r2_key = null;
    let logo_source = 'google';
    const logoFile = formData.get('logo') as File | null;
    
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 1024 * 1024) { // 1MB limit for initial upload
        return new Response(JSON.stringify({ error: "Logo file too large (max 1MB)" }), { status: 400 });
      }
      logo_r2_key = `pending/${id}.png`;
      logo_source = 'upload';
      await uploadLogo(env, logo_r2_key, logoFile);
    } else if (val.github_url && ghData?.owner?.avatar_url) {
      logo_source = 'github';
      try {
        const avatarRes = await fetch(ghData.owner.avatar_url);
        if (avatarRes.ok) {
          const blob = await avatarRes.blob();
          if (blob.size > 0 && blob.size <= 1024 * 1024) { // 1MB limit
            const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
            logo_r2_key = `pending/${id}.png`;
            await uploadLogo(env, logo_r2_key, file);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch/upload github avatar", e);
      }
    } else if (val.github_url) {
      logo_source = 'github';
    }

    // Resolve array fields: prefer form data, fall back to GitHub data, then empty
    const language = val.language || ghLanguage || '[]';
    const hardware = val.hardware || '[]';
    const deployment = val.deployment || '[]';
    const model_format = val.model_format || '[]';
    const maturity = val.maturity || null;

    // Insert into pending_tools
    const now = new Date().toISOString();
    
    if (env?.enclavetools_db) {
      await env.enclavetools_db.prepare(`
        INSERT INTO pending_tools (
          id, name, slug, description, url, github_url, category, license,
          language, hardware, deployment, model_format, maturity,
          popularity_score, date_added, last_updated, logo_source, logo_r2_key,
          github_data, status, submitted_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, 'pending', ?
        )
      `).bind(
        id, val.name, slug, val.description, val.url || null, val.github_url || null, val.category, val.license || null,
        language, hardware, deployment, model_format, maturity,
        popularity_score, now.split('T')[0], now.split('T')[0], logo_source, logo_r2_key,
        githubDataStr || null, now
      ).run();
    } else {
      console.warn("DB binding not found! Cannot save submission.");
    }

    return new Response(JSON.stringify({ success: true, id, slug }), { status: 200 });

  } catch (err: any) {
    console.error("Submission error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
