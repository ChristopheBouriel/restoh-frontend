/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Plugin to copy index.html to 404.html for Cloudflare Pages SPA fallback
const cloudflareSpaPagesPlugin = () => ({
  name: 'cloudflare-spa-pages',
  closeBundle() {
    const distPath = resolve(__dirname, 'dist')
    const indexHtml = readFileSync(resolve(distPath, 'index.html'), 'utf-8')
    writeFileSync(resolve(distPath, '404.html'), indexHtml)
    console.log('✓ Created 404.html for Cloudflare Pages SPA fallback')
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflareSpaPagesPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    exclude: [
      'node_modules/**',
      'e2e/**',
      '**/*.spec.ts',
    ],
    coverage: {
      exclude: [
        'node_modules/**',
        'e2e/**',
        'src/pages/dev/**',
        'src/api/mocks/**',
        'src/setupTests.js',
        'src/__tests__/**',
        '**/*.config.js',
      ],
    },
  },
})