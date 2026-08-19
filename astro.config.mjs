import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    site: 'https://enclavetools.com',
    integrations: [
        vue(),
        partytown({
            config: {
                forward: ["dataLayer.push"],
            },
        }),
        sitemap({
            filter: (page) => {
                const excluded = ['/admin', '/saved', '/submit', '/compare', '/stack-builder'];
                const urlObj = new URL(page);
                return !excluded.includes(urlObj.pathname.replace(/\/$/, ''));
            },
            serialize(item) {
                const urlStr = item.url instanceof URL ? item.url.href : item.url;
                // Ensure sitemap URLs don't have trailing slashes to match the canonical URL structure
                const noSlashUrl = urlStr.endsWith('/') && urlStr.length > 'https://enclavetools.com/'.length ? urlStr.slice(0, -1) : urlStr;
                return {
                    ...item,
                    url: noSlashUrl,
                    lastmod: item.lastmod || new Date().toISOString(),
                    changefreq: item.changefreq || 'weekly',
                    priority: item.priority || (urlStr.includes('/tools/') ? 0.8 : 0.5),
                };
            },
        })
    ],
    vite: {
        plugins: [tailwindcss()],
        envPrefix: ['VITE_'],
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.vue'],
        },
    },
    build: { format: 'file' },
    trailingSlash: 'never',
    adapter: cloudflare(),
    output: 'static',
});
