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
            filter: (page) =>
                page !== 'https://enclavetools.com/admin'
        })
    ],
    vite: {
        plugins: [tailwindcss()],
        envPrefix: ['VITE_'],
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.vue'],
        },
    },
    adapter: cloudflare(),
    output: 'static',
});
