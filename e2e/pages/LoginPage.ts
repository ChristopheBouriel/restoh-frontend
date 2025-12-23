import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators (lazy, évalués à l'utilisation)
  private get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email address' });
  }

  private get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  private get rememberMeCheckbox() {
    return this.page.getByRole('checkbox', { name: 'Remember me' });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Login' });
  }

  private get forgotPasswordLink() {
    return this.page.getByRole('link', { name: 'Forgot password?' });
  }

  private get registerLink() {
    return this.page.getByRole('link', { name: 'create a new account' });
  }

  private get returnHomeLink() {
    return this.page.getByRole('link', { name: /Return to home/i });
  }

  // Actions
  async goto() {
    await super.goto('/login');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async checkRememberMe() {
    await this.rememberMeCheckbox.check();
  }

  async uncheckRememberMe() {
    await this.rememberMeCheckbox.uncheck();
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string, rememberMe = false) {
    await this.fillEmail(email);
    await this.fillPassword(password);

    if (rememberMe) {
      await this.checkRememberMe();
    }

    await this.submit();
  }

  async loginAndExpectSuccess(email: string, password: string, rememberMe = false) {
    await this.login(email, password, rememberMe);
    // Attendre redirection hors de /login
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  }

  async loginAndExpectError(email: string, password: string, errorMessage?: string | RegExp) {
    await this.login(email, password);
    // Attendre le toast d'erreur
    await this.expectErrorToast(errorMessage);
    // Vérifier qu'on reste sur /login
    await expect(this.page).toHaveURL(/\/login/);
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/forgot-password/);
  }

  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/\/register/);
  }

  async goToHome() {
    await this.returnHomeLink.click();
    await this.page.waitForURL('/');
  }

  // Assertions
  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectEmailError(message?: string | RegExp) {
    // Les erreurs de validation apparaissent généralement sous le champ
    const errorText = this.page.locator('text=' + (message || 'email'));
    await expect(errorText).toBeVisible();
  }

  async expectPasswordError(message?: string | RegExp) {
    const errorText = this.page.locator('text=' + (message || 'password'));
    await expect(errorText).toBeVisible();
  }

  async expectRememberMeChecked() {
    await expect(this.rememberMeCheckbox).toBeChecked();
  }

  async expectRememberMeUnchecked() {
    await expect(this.rememberMeCheckbox).not.toBeChecked();
  }
}
