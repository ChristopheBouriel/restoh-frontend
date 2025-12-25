import { test, expect } from '@playwright/test';

test.describe('Admin Access Control', () => {
  test.describe('Non-admin user access', () => {
    // Override storageState to use regular user instead of admin
    test.use({ storageState: './e2e/.auth/user.json' });

    test('should deny non-admin access to dashboard', async ({ page }) => {
      await page.goto('/admin');
      // Should show access denied message
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
      await expect(page.getByText(/do not have permission/i)).toBeVisible();
    });

    test('should deny non-admin access to orders management', async ({ page }) => {
      await page.goto('/admin/orders');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('should deny non-admin access to reservations management', async ({ page }) => {
      await page.goto('/admin/reservations');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('should deny non-admin access to menu management', async ({ page }) => {
      await page.goto('/admin/menu');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('should deny non-admin access to users management', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('should allow returning home from access denied page', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();

      await page.getByRole('button', { name: /return to home/i }).click();
      await expect(page).toHaveURL('/');
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
