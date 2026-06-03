import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const outputPath = path.join(dataDir, 'site-content.json');

const defaultContent: Record<string, string> = {
  nav_browse: 'Browse',
  nav_use_cases: 'Use cases',
  nav_compare: 'Compare',
  nav_stack: 'Stack',
  nav_latest: 'Latest',
  nav_saved_tools: 'Saved tools',
  nav_submit: 'Submit',
  nav_all_categories: 'All Categories',
  footer_tagline: 'Your models. Your hardware. Zero subscriptions.',
  footer_copyright: '© 2026 Enclavetools',
  hero_eyebrow: 'Private AI Tools Directory',
  hero_title: 'Find the right AI tool for your hardware',
  hero_tagline: 'Stop paying for AI APIs. Everything here runs on your hardware.',
  search_placeholder: 'Search tools...',
  sort_recently_added: 'Recently added',
  sort_last_updated: 'Last updated',
  sort_most_stars: 'Most stars',
  empty_no_results: 'No tools match your filters',
  cta_browse_all: 'Browse all tools',
  cta_use_cases: 'Find tools for my use case',
  cta_compare: 'Compare tools',
  cta_build_stack: 'Build a stack',
  section_featured_tools: 'Featured Tools',
  section_latest_added: 'Latest Added',
  section_browse_all: 'Browse all',
  section_start_with_job: 'Start with the job',
  section_choose_category: 'Choose a category...',
  sponsor_label: 'Sponsor',
  newsletter_title: '5 new tools, every Friday',
  newsletter_subtitle: 'No fluff. No spam. Join 12,000+ builders.',
  newsletter_placeholder: 'your@email.com',
};

async function main() {
  console.log("Fetching site content from D1...");

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn("⚠️  Missing Cloudflare credentials. Using default site content.");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultContent, null, 2));
    console.log("✅ Generated default site-content.json");
    return;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: 'SELECT key, value FROM site_content' })
    });

    if (!res.ok) throw new Error(`D1 API Error: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);

    const rows = json.result[0].results;
    const content: Record<string, string> = { ...defaultContent };

    for (const row of rows) {
      content[row.key] = row.value;
    }

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
    console.log(`✅ Generated site-content.json with ${Object.keys(content).length} entries`);

  } catch (error: any) {
    console.error("❌ Error fetching site content:", error.message);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultContent, null, 2));
    console.log("⚠️  Fell back to default site-content.json");
  }
}

main();
