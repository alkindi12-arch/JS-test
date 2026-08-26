import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Measure Draw',
        short_name: 'MeasureDraw',
        description: 'Calibrate a photo, measure objects, and export a dimensioned drawing.',
        theme_color: '#1a3530',
        background_color: '#e7eef1',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
    // Allow Cloudflare / ngrok style tunnels so phones can open the preview URL.
    allowedHosts: true,
  },
})
