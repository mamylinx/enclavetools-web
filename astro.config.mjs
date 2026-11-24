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
                const excluded = ['/404', '/admin', '/benchmark-waitlist', '/saved', '/submit', '/compare', '/stack-builder'];
                const urlObj = new URL(page);
                return !excluded.includes(urlObj.pathname.replace(/\/$/, ''));
            },
            serialize(item) {
                const url = new URL(item.url);
                if (url.pathname !== '/') {
                    url.pathname = url.pathname.replace(/\/$/, '');
                }
                return {
                    ...item,
                    url: url.href,
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
