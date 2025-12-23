import { test as setup, expect } from '@playwright/test';

const USER_FILE = './e2e/.auth/user.json';
const ADMIN_FILE = './e2e/.auth/admin.json';

// Credentials de test (utiliser les comptes démo de l'app)
const TEST_USER = {
  email: process.env.E2E_USER_EMAIL || 'demo@test.com',
  password: process.env.E2E_USER_PASSWORD || '123456',
};

const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@restoh.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'admin123',
};

setup('authenticate as user', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('/login');

  // Remplir le formulaire
  await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_USER.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_USER.password);

  // Soumettre
  await page.getByRole('button', { name: 'Login' }).click();

  // Attendre la redirection (hors de /login)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  // Vérifier qu'on est connecté (le header affiche le nom de l'utilisateur)
  // Le bouton utilisateur affiche le nom (ex: "Demo User")
  await expect(
    page.locator('header').getByRole('button').filter({ hasText: /user|admin|profile/i })
  ).toBeVisible({ timeout: 5000 });

  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: USER_FILE });
});

setup('authenticate as admin', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('/login');

  // Remplir le formulaire
  await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_ADMIN.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_ADMIN.password);

  // Soumettre
  await page.getByRole('button', { name: 'Login' }).click();

  // Admin redirigé vers dashboard admin ou home
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  // Vérifier qu'on est connecté (le header affiche le nom de l'admin)
  await expect(
    page.locator('header').getByRole('button').filter({ hasText: /admin|user|profile/i })
  ).toBeVisible({ timeout: 5000 });

  // Sauvegarder l'état d'authentification admin
  await page.context().storageState({ path: ADMIN_FILE });
});
