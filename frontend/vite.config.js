import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify('https://the-drop-production.up.railway.app'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/articles/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'articles-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /\/api\/categories/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'categories-cache',
              expiration: { maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\.(woff2?|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxAgeSeconds: 2592000 },
            },
          },
        ],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'The Drop - News for Gen Z',
        short_name: 'The Drop',
        description: 'Youth news app for ages 8-20',
        theme_color: '#1A1A2E',
        background_color: '#1A1A2E',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})
