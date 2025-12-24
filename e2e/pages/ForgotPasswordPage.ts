import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ForgotPasswordPage extends BasePage {
  // Locators
  private get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email address' });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Send Reset Link' });
  }

  private get backToLoginLink() {
    return this.page.getByRole('link', { name: /back to login/i });
  }

  private get homeLink() {
    return this.page.getByRole('link', { name: 'RestOh!' });
  }

  // Success state elements
  private get successHeading() {
    return this.page.getByRole('heading', { name: 'Check Your Email' });
  }

  private get returnToLoginButton() {
    return this.page.getByRole('link', { name: 'Return to Login' });
  }

  private get sendAnotherLinkButton() {
    return this.page.getByRole('button', { name: 'Send another reset link' });
  }

  // Actions
  async goto() {
    await super.goto('/forgot-password');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async submit() {
    await this.submitButton.click();
  }

  async requestPasswordReset(email: string) {
    await this.fillEmail(email);
    await this.submit();
  }

  async goBackToLogin() {
    await this.backToLoginLink.click();
    await this.page.waitForURL(/\/login/);
  }

  async goToHome() {
    await this.homeLink.click();
    await this.page.waitForURL('/');
  }

  async returnToLogin() {
    await this.returnToLoginButton.click();
    await this.page.waitForURL(/\/login/);
  }

  async sendAnotherLink() {
    await this.sendAnotherLinkButton.click();
  }

  // Assertions
  async expectToBeOnForgotPasswordPage() {
    await expect(this.page).toHaveURL(/\/forgot-password/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectSuccessState() {
    await expect(this.successHeading).toBeVisible({ timeout: 10000 });
    await expect(this.returnToLoginButton).toBeVisible();
    await expect(this.sendAnotherLinkButton).toBeVisible();
  }

  async expectEmailShownInSuccess(email: string) {
    const emailText = this.page.getByText(email);
    await expect(emailText).toBeVisible();
  }

  async expectEmailValidationError() {
    // Check for the validation error message
    const errorMessage = this.page.getByText(/invalid email|email is required/i);
    await expect(errorMessage).toBeVisible();
  }

  async expectSubmitButtonDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitButtonEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}
