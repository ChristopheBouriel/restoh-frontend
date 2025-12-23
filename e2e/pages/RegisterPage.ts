import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  // Locators
  private get fullNameInput() {
    return this.page.getByRole('textbox', { name: 'Full name' });
  }

  private get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email address' });
  }

  private get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password', exact: true });
  }

  private get confirmPasswordInput() {
    return this.page.getByRole('textbox', { name: 'Confirm password' });
  }

  private get termsCheckbox() {
    return this.page.getByRole('checkbox', { name: /terms of use/i });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Create my account' });
  }

  private get loginLink() {
    return this.page.getByRole('link', { name: 'log in to your existing account' });
  }

  private get returnHomeLink() {
    return this.page.getByRole('link', { name: /Return to home/i });
  }

  // Actions
  async goto() {
    await super.goto('/register');
  }

  async fillFullName(name: string) {
    await this.fullNameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async acceptTerms() {
    // Utiliser click() au lieu de check() car le label peut interférer
    const isChecked = await this.termsCheckbox.isChecked();
    if (!isChecked) {
      await this.termsCheckbox.click();
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
  }) {
    await this.fillFullName(data.fullName);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.confirmPassword || data.password);

    if (data.acceptTerms !== false) {
      await this.acceptTerms();
    }

    await this.submit();
  }

  async registerAndExpectSuccess(data: {
    fullName: string;
    email: string;
    password: string;
  }) {
    await this.register(data);
    // Attendre redirection vers la page de vérification email ou login
    await this.page.waitForURL((url) =>
      !url.pathname.includes('/register'),
      { timeout: 10000 }
    );
  }

  async registerAndExpectError(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
  }, errorMessage?: string | RegExp) {
    await this.register(data);
    await this.expectErrorToast(errorMessage);
    // Vérifier qu'on reste sur /register
    await expect(this.page).toHaveURL(/\/register/);
  }

  async goToLogin() {
    await this.loginLink.click();
    await this.page.waitForURL(/\/login/);
  }

  async goToHome() {
    await this.returnHomeLink.click();
    await this.page.waitForURL('/');
  }

  // Assertions
  async expectToBeOnRegisterPage() {
    await expect(this.page).toHaveURL(/\/register/);
    await expect(this.fullNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectTermsAccepted() {
    await expect(this.termsCheckbox).toBeChecked();
  }

  async expectTermsNotAccepted() {
    await expect(this.termsCheckbox).not.toBeChecked();
  }
}
