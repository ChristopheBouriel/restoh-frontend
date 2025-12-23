import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  unauthenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Page avec utilisateur connecté (défaut via storageState dans config)
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },

  // Page avec admin connecté
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: './e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Page sans authentification (pour tester login/register)
  unauthenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: undefined,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
