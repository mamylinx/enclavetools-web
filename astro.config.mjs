import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";
import netlify from "@astrojs/netlify";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    site: 'https://enclavetools.come',
    integrations: [
        vue(),
        partytown({
            config: {
                forward: ["dataLayer.push"],
            },
        }),
        sitemap()
    ],
    vite: {
        plugins: [tailwindcss()],
        envPrefix: ['VITE_', 'SUPABASE_'],
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.vue'],
        },
    },
    adapter: cloudflare()
});
