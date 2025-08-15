import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/gutendx\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gutenberg-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.gutenberg\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gutenberg-texts',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Gutenberg Character Analysis',
        short_name: 'Gutenberg Insights',
        description: 'AI-powered character analysis for Project Gutenberg books',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize for production
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'analysis-vendor': ['comlink'],
          'graph-vendor': ['react-force-graph-2d', 'd3-force']
        }
      }
    },
    // Enable source maps for debugging
    sourcemap: true
  },
  // Web Workers support
  worker: {
    format: 'es'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? process.env.VITE_API_URL || 'https://gutenberg-characters.onrender.com'
          : process.env.VITE_API_URL || 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Optimize dev server
    hmr: {
      overlay: false // Disable overlay for web worker errors
    }
  },
})
