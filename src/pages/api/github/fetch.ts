import type { APIRoute } from 'astro';
export const prerender = false;
import { env } from 'cloudflare:workers';
import { checkRateLimit } from '../../../lib/rate-limit';

export const GET: APIRoute = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  
  // Rate limit: 30 requests per hour per IP
  const allowed = await checkRateLimit(env, ip, 'github_fetch', 30, 3600);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
  }

  const url = new URL(context.request.url);
  const repoUrl = url.searchParams.get('url');
  
  if (!repoUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), { status: 400 });
  }

  let owner, repo;
  try {
    const parsedUrl = new URL(repoUrl);
    if (parsedUrl.hostname !== 'github.com') throw new Error();
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    if (parts.length < 2) throw new Error();
    owner = parts[0];
    repo = parts[1];
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid GitHub URL" }), { status: 400 });
  }

  const headers: Record<string, string> = {
    'User-Agent': 'Enclavetools',
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (env?.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  
  if (!ghRes.ok) {
    return new Response(JSON.stringify({ error: "Failed to fetch from GitHub" }), { status: ghRes.status });
  }

  const data = await ghRes.json();
  
  return new Response(JSON.stringify({
    name: data.name,
    description: data.description,
    avatar_url: data.owner?.avatar_url,
    language: data.language,
    stars: data.stargazers_count,
    license: data.license?.spdx_id || null,
    raw: data
  }), { status: 200, headers: { 'Content-Type': 'application/json' }});
};
