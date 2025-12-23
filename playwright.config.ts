import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for RestOh E2E Tests
 * Based on E2E_TESTING_PLAN.md
 */
export default defineConfig({
  // Dossier des tests
  testDir: './e2e/tests',

  // Exécution parallèle
  fullyParallel: true,

  // Échouer si test.only() oublié en CI
  forbidOnly: !!process.env.CI,

  // Retries : 2 en CI, 0 en local
  retries: process.env.CI ? 2 : 0,

  // Workers : 1 en CI (stabilité), max en local
  workers: process.env.CI ? 1 : undefined,

  // Reporters
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e/test-results/results.json' }],
    // GitHub Actions annotations
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Options globales
  use: {
    // URL de base
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // Traces uniquement sur premier retry (debug CI)
    trace: 'on-first-retry',

    // Screenshots sur échec
    screenshot: 'only-on-failure',

    // Vidéos conservées sur échec
    video: 'retain-on-failure',

    // Timeout actions
    actionTimeout: 10000,

    // Timeout navigation
    navigationTimeout: 30000,
  },

  // Timeout global par test
  timeout: 60000,

  // Projets (navigateurs + devices)
  projects: [
    // === SETUP ===
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },

    // === DESKTOP (tests authentifiés) ===
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // === TESTS NON-AUTHENTIFIÉS (login, register) ===
    {
      name: 'chromium-no-auth',
      testMatch: /auth\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // === MOBILE ===
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // === ADMIN (projet séparé) ===
    {
      name: 'admin',
      testMatch: /admin\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Serveur de dev automatique
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
