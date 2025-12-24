import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ResetPasswordPage extends BasePage {
  // Locators
  private get passwordInput() {
    return this.page.getByRole('textbox', { name: 'New Password' });
  }

  private get confirmPasswordInput() {
    return this.page.getByRole('textbox', { name: 'Confirm Password' });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Reset Password' });
  }

  private get backToLoginLink() {
    return this.page.getByRole('link', { name: /back to login/i });
  }

  private get homeLink() {
    return this.page.getByRole('link', { name: 'RestOh!' });
  }

  // Toggle password visibility buttons
  private get togglePasswordVisibility() {
    return this.page.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  // Success state elements
  private get successHeading() {
    return this.page.getByRole('heading', { name: 'Password Reset Successfully!' });
  }

  private get goToLoginButton() {
    return this.page.getByRole('link', { name: 'Go to Login Now' });
  }

  // Error elements
  private get errorAlert() {
    return this.page.locator('.bg-red-50');
  }

  private get expiredTokenWarning() {
    return this.page.locator('.bg-yellow-50');
  }

  private get requestNewLinkButton() {
    return this.page.getByRole('link', { name: 'Request a new reset link' });
  }

  // Actions
  async goto(token: string = 'test-token') {
    await super.goto(`/reset-password/${token}`);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async resetPassword(password: string, confirmPassword?: string) {
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword ?? password);
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

  async goToLoginFromSuccess() {
    await this.goToLoginButton.click();
    await this.page.waitForURL(/\/login/);
  }

  async requestNewResetLink() {
    await this.requestNewLinkButton.click();
    await this.page.waitForURL(/\/forgot-password/);
  }

  // Trigger validation by tabbing through fields
  async triggerValidation() {
    await this.passwordInput.click();
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
  }

  // Assertions
  async expectToBeOnResetPasswordPage() {
    await expect(this.page).toHaveURL(/\/reset-password/);
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectSuccessState() {
    await expect(this.successHeading).toBeVisible({ timeout: 10000 });
    await expect(this.goToLoginButton).toBeVisible();
  }

  async expectPasswordValidationError(message?: string | RegExp) {
    const errorText = message
      ? this.page.getByText(message)
      : this.page.getByText(/password is required|at least 6 characters/i);
    await expect(errorText).toBeVisible();
  }

  async expectPasswordMismatchError() {
    const errorText = this.page.getByText(/passwords do not match/i);
    await expect(errorText).toBeVisible();
  }

  async expectTokenExpiredError() {
    await expect(this.expiredTokenWarning).toBeVisible();
    await expect(this.requestNewLinkButton).toBeVisible();
  }

  async expectGenericError(message?: string | RegExp) {
    await expect(this.errorAlert).toBeVisible();
    if (message) {
      await expect(this.errorAlert).toContainText(message);
    }
  }

  async expectSubmitButtonDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitButtonEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}
