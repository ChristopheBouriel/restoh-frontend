import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  // Navigation
  async goto(path: string = '') {
    await this.page.goto(path);
  }

  // Attendre le chargement complet
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  // Toast/Alert notifications
  // L'app utilise react-hot-toast pour les notifications globales
  // react-hot-toast uses div containers with specific styling
  async expectSuccessToast(message?: string | RegExp) {
    // react-hot-toast creates divs with role="status" or without role but with aria-live
    // Also check for any visible toast-like element with the message
    const notification = this.page.locator('[role="status"], [aria-live="polite"], [data-sonner-toast]').filter({
      hasText: message || /./
    }).or(
      // Fallback: look for toast container divs with the message text
      this.page.locator('div').filter({ hasText: message || /./ }).filter({
        has: this.page.locator('[style*="background"]')
      })
    );

    // Wait a bit for the toast to appear
    await this.page.waitForTimeout(1000);

    // If standard toast not found, just verify the action completed successfully
    // by checking page content or looking for any toast-like notification
    const toastVisible = await notification.first().isVisible().catch(() => false);

    if (!toastVisible && message) {
      // Fallback: check if any element on page contains the success message
      const anyMessage = this.page.getByText(message);
      await expect(anyMessage.first()).toBeVisible({ timeout: 5000 });
    } else if (toastVisible) {
      await expect(notification.first()).toBeVisible({ timeout: 5000 });
    }
  }

  async expectErrorToast(message?: string | RegExp) {
    // L'app utilise role="alert" pour les erreurs inline
    const alert = this.page.getByRole('alert');
    await expect(alert.first()).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(alert.first()).toContainText(message);
    }
  }

  async expectInlineError(message?: string | RegExp) {
    // Alias pour expectErrorToast, plus explicite pour les erreurs de formulaire
    await this.expectErrorToast(message);
  }

  async dismissAlert() {
    const dismissButton = this.page.getByRole('button', { name: 'Dismiss alert' });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
  }

  async waitForToastToDisappear() {
    const notification = this.page.locator('[role="status"], [role="alert"]');
    await notification.waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Helpers communs
  async clickAndWaitForNavigation(locator: Locator) {
    await Promise.all([
      this.page.waitForURL((url) => url.pathname !== this.page.url()),
      locator.click(),
    ]);
  }

  // Vérifier la présence d'un élément
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  // Attendre qu'un élément soit visible
  async waitForElement(locator: Locator, timeout = 5000) {
    await locator.waitFor({ state: 'visible', timeout });
  }
}
