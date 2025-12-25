/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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