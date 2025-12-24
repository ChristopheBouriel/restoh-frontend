import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: /profile|my account/i, level: 1 });
  }

  // Profile form
  private get nameInput() {
    return this.page.getByRole('textbox', { name: /name/i });
  }

  private get emailInput() {
    return this.page.getByRole('textbox', { name: /email/i });
  }

  private get phoneInput() {
    return this.page.getByRole('textbox', { name: /phone/i });
  }

  private get saveProfileButton() {
    return this.page.getByRole('button', { name: /save|update profile/i });
  }

  // Password change form
  private get currentPasswordInput() {
    return this.page.getByRole('textbox', { name: /current password/i });
  }

  private get newPasswordInput() {
    return this.page.getByRole('textbox', { name: /new password/i });
  }

  private get confirmPasswordInput() {
    return this.page.getByRole('textbox', { name: /confirm.*password/i });
  }

  private get changePasswordButton() {
    return this.page.getByRole('button', { name: /change password/i });
  }

  // Delete account
  private get deleteAccountButton() {
    return this.page.getByRole('button', { name: /delete.*account/i });
  }

  private get deleteConfirmInput() {
    return this.page.getByRole('textbox', { name: /type.*delete|confirm/i });
  }

  private get deletePasswordInput() {
    return this.page.getByRole('textbox', { name: /password/i }).last();
  }

  private get confirmDeleteButton() {
    return this.page.getByRole('button', { name: /confirm.*delete|delete.*account/i }).last();
  }

  // Order history section
  private get orderHistorySection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /order.*history|my orders/i })
    });
  }

  private get orderHistoryItems() {
    return this.orderHistorySection.locator('div').filter({
      has: this.page.getByText(/order|#/i)
    });
  }

  // Actions
  async goto() {
    await super.goto('/profile');
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async updateName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async updatePhone(phone: string) {
    await this.phoneInput.clear();
    await this.phoneInput.fill(phone);
  }

  async saveProfile() {
    await this.saveProfileButton.click();
  }

  async updateProfile(data: { name?: string; phone?: string }) {
    if (data.name) {
      await this.updateName(data.name);
    }
    if (data.phone) {
      await this.updatePhone(data.phone);
    }
    await this.saveProfile();
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword?: string) {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword || newPassword);
    await this.changePasswordButton.click();
  }

  async initiateDeleteAccount() {
    await this.deleteAccountButton.click();
  }

  async confirmDeleteAccount(password: string) {
    // Type "DELETE" in confirmation input
    await this.deleteConfirmInput.fill('DELETE');
    await this.deletePasswordInput.fill(password);
    await this.confirmDeleteButton.click();
  }

  async getOrderHistoryCount(): Promise<number> {
    return this.orderHistoryItems.count();
  }

  async viewOrderDetails(index: number = 0) {
    await this.orderHistoryItems.nth(index).click();
  }

  // Assertions
  async expectToBeOnProfilePage() {
    await expect(this.page).toHaveURL(/\/profile/);
    await expect(this.heading).toBeVisible();
  }

  async expectProfileData(data: { name?: string; email?: string; phone?: string }) {
    if (data.name) {
      await expect(this.nameInput).toHaveValue(data.name);
    }
    if (data.email) {
      await expect(this.emailInput).toHaveValue(data.email);
    }
    if (data.phone) {
      await expect(this.phoneInput).toHaveValue(data.phone);
    }
  }

  async expectProfileUpdateSuccess() {
    await this.expectSuccessToast(/profile.*updated|saved/i);
  }

  async expectPasswordChangeSuccess() {
    await this.expectSuccessToast(/password.*changed|updated/i);
  }

  async expectPasswordError(message: string) {
    await expect(
      this.page.getByRole('alert').filter({ hasText: new RegExp(message, 'i') })
    ).toBeVisible();
  }

  async expectDeleteModalVisible() {
    await expect(
      this.page.getByRole('dialog').filter({ hasText: /delete.*account/i })
    ).toBeVisible();
  }

  async expectDeleteBlocked(reason: string) {
    await expect(
      this.page.getByText(new RegExp(reason, 'i'))
    ).toBeVisible();
  }

  async expectOrderHistoryVisible() {
    await expect(this.orderHistorySection).toBeVisible();
  }

  async expectOrderCount(count: number) {
    expect(await this.getOrderHistoryCount()).toBe(count);
  }
}
