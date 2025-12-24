import { test, expect } from '@playwright/test';

// Ces tests utilisent le projet 'chromium' (user normal, pas admin)
// pour vérifier que les routes admin sont protégées
test.describe('Admin Access Control', () => {
  test.describe('Non-admin user access', () => {
    // Note: Ces tests s'exécutent avec l'utilisateur normal (storageState user.json)
    // et non avec l'admin

    test('should redirect non-admin from dashboard', async ({ page }) => {
      await page.goto('/admin');

      // Devrait rediriger vers login ou afficher une erreur
      await expect(page).not.toHaveURL(/\/admin$/);

      // Soit redirection vers login/home, soit message d'erreur
      const isRedirected = await page.url().match(/\/(login|home)?$/);
      const hasError = await page.getByText(/access denied|unauthorized|forbidden|not authorized/i).isVisible();

      expect(isRedirected || hasError).toBeTruthy();
    });

    test('should redirect non-admin from orders management', async ({ page }) => {
      await page.goto('/admin/orders');

      await expect(page).not.toHaveURL(/\/admin\/orders$/);
    });

    test('should redirect non-admin from reservations management', async ({ page }) => {
      await page.goto('/admin/reservations');

      await expect(page).not.toHaveURL(/\/admin\/reservations$/);
    });

    test('should redirect non-admin from menu management', async ({ page }) => {
      await page.goto('/admin/menu');

      await expect(page).not.toHaveURL(/\/admin\/menu$/);
    });

    test('should redirect non-admin from users management', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page).not.toHaveURL(/\/admin\/users$/);
    });
  });
});

// Tests pour visiteurs non connectés
test.describe('Unauthenticated access', () => {
  // Ces tests doivent utiliser un contexte sans authentification
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect unauthenticated user from admin', async ({ page }) => {
    await page.goto('/admin');

    // Devrait rediriger vers login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from admin orders', async ({ page }) => {
    await page.goto('/admin/orders');

    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from admin reservations', async ({ page }) => {
    await page.goto('/admin/reservations');

    await expect(page).toHaveURL(/\/login/);
  });
});
