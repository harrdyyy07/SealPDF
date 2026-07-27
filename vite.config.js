import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'favicon.png', 'favicon-512.png', 'logo.png', 'robots.txt', 'sitemap.xml'],
    workbox: {
      navigateFallbackDenylist: [
        /^\/sitemap\.xml$/,
        /^\/robots\.txt$/,
        /^\/ads\.txt$/,
        /^\/googleed8f3eaef53d5729\.html$/
      ]
    },
    manifest: {
      name: 'SealPDF Professional Toolkit',
      short_name: 'SealPDF',
      description: 'Professional, fast, and secure PDF toolkit.',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      icons: [
        {
          src: 'favicon.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'favicon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'favicon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  }), cloudflare()],
})