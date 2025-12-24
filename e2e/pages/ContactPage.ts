import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContactPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: /contact/i, level: 1 });
  }

  private get nameInput() {
    return this.page.getByRole('textbox', { name: /name/i });
  }

  private get emailInput() {
    return this.page.getByRole('textbox', { name: /email/i });
  }

  private get subjectInput() {
    return this.page.getByRole('textbox', { name: /subject/i });
  }

  private get messageInput() {
    return this.page.getByRole('textbox', { name: /message/i });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: /send|submit/i });
  }

  // Restaurant info section
  private get addressSection() {
    return this.page.locator('section').filter({ hasText: /address|location/i });
  }

  private get hoursSection() {
    return this.page.locator('section').filter({ hasText: /hours|opening/i });
  }

  private get phoneSection() {
    return this.page.locator('section').filter({ hasText: /phone|call/i });
  }

  // Actions
  async goto() {
    await super.goto('/contact');
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillSubject(subject: string) {
    await this.subjectInput.fill(subject);
  }

  async fillMessage(message: string) {
    await this.messageInput.fill(message);
  }

  async submit() {
    await this.submitButton.click();
  }

  async sendMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    await this.fillSubject(data.subject);
    await this.fillMessage(data.message);
    await this.submit();
  }

  async getAddress(): Promise<string> {
    return await this.addressSection.textContent() || '';
  }

  async getPhone(): Promise<string> {
    return await this.phoneSection.textContent() || '';
  }

  // Assertions
  async expectToBeOnContactPage() {
    await expect(this.page).toHaveURL(/\/contact/);
    await expect(this.heading).toBeVisible();
  }

  async expectMessageSent() {
    await this.expectSuccessToast(/message.*sent|thank you|received/i);
  }

  async expectFormError(field: string) {
    await expect(
      this.page.getByRole('alert').filter({ hasText: new RegExp(field, 'i') })
    ).toBeVisible();
  }

  async expectFieldError(fieldName: string, message: string) {
    const field = this.page.getByRole('textbox', { name: new RegExp(fieldName, 'i') });
    await expect(field.locator('..').getByText(message)).toBeVisible();
  }

  async expectFormCleared() {
    await expect(this.nameInput).toHaveValue('');
    await expect(this.emailInput).toHaveValue('');
    await expect(this.subjectInput).toHaveValue('');
    await expect(this.messageInput).toHaveValue('');
  }

  async expectRestaurantInfoVisible() {
    await expect(this.addressSection).toBeVisible();
    await expect(this.hoursSection).toBeVisible();
    await expect(this.phoneSection).toBeVisible();
  }
}
