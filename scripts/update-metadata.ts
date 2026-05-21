import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metadataPath = path.join(__dirname, '../src/data/metadata.json');
const faviconsDir = path.join(__dirname, '../public/favicons');

const CONCURRENCY_LIMIT = 25;
const TIMEOUT_MS = 6000;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

if (!fs.existsSync(faviconsDir)) {
    fs.mkdirSync(faviconsDir, { recursive: true });
    console.log(`📁 Created favicons directory: ${faviconsDir}`);
}

function extractDomain(url: string): string | null {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return null;
    }
}

async function fetchFavicon(slug: string, url: string): Promise<boolean> {
    if (!url || !slug) return false;

    const domain = extractDomain(url);
    if (!domain) return false;

    const faviconPath = path.join(faviconsDir, `${slug}.png`);

    if (fs.existsSync(faviconPath)) {
        return true;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
        const response = await fetch(faviconUrl, {
            headers: { "User-Agent": USER_AGENT },
            signal: controller.signal,
        });

        if (!response.ok) return false;

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(faviconPath, new Uint8Array(buffer));
        return true;

    } catch {
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchMetadata(slug: string, url: string) {
    if (!url) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT },
            signal: controller.signal,
        });

        if (!response.ok) return null;

        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("text/html")) return null;

        const html = await response.text();
        const root = parse(html);

        const title =
            root.querySelector('title')?.text?.trim() ||
            root.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();

        const description =
            root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
            root.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();

        const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim();

        if (!title && !description && !ogImage) return null;

        return {
            slug,
            title: title || undefined,
            description: description || undefined,
            ogImage: ogImage || undefined,
        };

    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function main() {
    console.log("🚀 Starting metadata and favicon update...\n");

    // Load tools from local JSON instead of fetchAllTools()
    const toolsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tools.json'), 'utf-8'));
    
    // Flatten all tools from categories
    const allTools = toolsData.tools.flatMap((cat: any) => 
        cat.content.map((tool: any) => ({
            ...tool,
            category: cat.category,
        }))
    );

    const filteredTools = allTools.filter(t => t.slug && t.url);
    console.log(`Found ${filteredTools.length} tools. Starting fetch (Concurrency: ${CONCURRENCY_LIMIT})...\n`);

    let completed = 0;
    let metadataFetched = 0;
    let faviconsFetched = 0;
    let existingMetadata: Record<string, any> = {};

    if (fs.existsSync(metadataPath)) {
        try {
            existingMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        } catch {
            console.log("Could not read existing metadata, starting fresh.");
        }
    }

    const results: Record<string, any> = {};

    for (let i = 0; i < filteredTools.length; i += CONCURRENCY_LIMIT) {
        const chunk = filteredTools.slice(i, i + CONCURRENCY_LIMIT);
        const promises = chunk.map(async (tool) => {
            const slug = tool.slug as string;

            const faviconSuccess = await fetchFavicon(slug, tool.url);
            if (faviconSuccess) faviconsFetched++;

            if (existingMetadata[slug] && existingMetadata[slug].title) {
                results[slug] = existingMetadata[slug];
                completed++;
                return;
            }

            const res = await fetchMetadata(slug, tool.url);
            completed++;
            if (completed % 50 === 0) {
                process.stdout.write(`\rProgress: ${completed}/${filteredTools.length} | Metadata: ${metadataFetched} | Favicons: ${faviconsFetched}`);
            }
            if (res && res.slug) {
                results[res.slug] = res;
                metadataFetched++;
            }
        });

        await Promise.all(promises);
    }

    console.log(`\n\n✨ Update complete!`);
    console.log(`📊 Metadata entries: ${Object.keys(results).length}`);
    console.log(`🎨 Favicons stored: ${faviconsFetched}`);
    console.log(`📁 Favicon directory: ${faviconsDir}`);

    fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Saved metadata to ${metadataPath}`);
}

main();
