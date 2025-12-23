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
  // L'app utilise des alerts inline (role="alert") pour les erreurs de formulaire
  // et potentiellement react-hot-toast (role="status") pour les notifications globales
  async expectSuccessToast(message?: string | RegExp) {
    // Chercher soit un toast react-hot-toast, soit une alert de succès
    const notification = this.page.locator('[role="status"], [role="alert"]').filter({
      hasText: message || /./
    });
    await expect(notification.first()).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(notification.first()).toContainText(message);
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
