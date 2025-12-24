import { test, expect } from '@playwright/test';
import { NavbarComponent } from '../../components/NavbarComponent';

/**
 * Logout tests - These tests modify authentication state
 * They use a fresh context with the user storage state to avoid affecting other tests
 */
test.describe('Logout', () => {
  // Use the authenticated project explicitly
  test.use({ storageState: './e2e/.auth/user.json' });

  test('should logout user', async ({ browser }) => {
    // Create an isolated context so logout doesn't affect other tests
    const context = await browser.newContext({
      storageState: './e2e/.auth/user.json',
    });
    const page = await context.newPage();
    const navbar = new NavbarComponent(page);

    await page.goto('/');

    await navbar.logout();

    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(login)?$/);

    // Clean up
    await context.close();
  });
});
