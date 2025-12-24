import { Page, Locator, expect } from '@playwright/test';

export class CartModalComponent {
  constructor(private page: Page) {}

  private get modal() {
    return this.page.locator('div').filter({
      has: this.page.getByRole('heading', { name: /my cart/i, level: 2 })
    }).first();
  }

  private get heading() {
    return this.page.getByRole('heading', { name: /my cart/i, level: 2 });
  }

  private get closeButton() {
    return this.modal.getByRole('button').filter({ has: this.page.locator('svg') }).first();
  }

  private get cartItems() {
    return this.modal.locator('div').filter({
      has: this.page.getByRole('heading', { level: 3 })
    });
  }

  private get emptyCartButton() {
    return this.page.getByRole('button', { name: 'Empty cart' });
  }

  private get totalAmount() {
    return this.modal.locator('text=/Total to pay/').locator('..').locator('div').last();
  }

  private get orderButton() {
    return this.page.getByRole('button', { name: /order/i });
  }

  private get continueShoppingButton() {
    return this.page.getByRole('button', { name: 'Continue shopping' });
  }

  // Actions
  async close() {
    await this.closeButton.click();
  }

  async getItemCount(): Promise<number> {
    const heading = await this.heading.textContent();
    const match = heading?.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : 0;
  }

  async increaseItemQuantity(itemName: string) {
    const item = this.cartItems.filter({ hasText: itemName });
    await item.getByRole('button').filter({ has: this.page.locator('svg') }).last().click();
  }

  async decreaseItemQuantity(itemName: string) {
    const item = this.cartItems.filter({ hasText: itemName });
    await item.getByRole('button').filter({ has: this.page.locator('svg') }).first().click();
  }

  async removeItem(itemName: string) {
    const item = this.cartItems.filter({ hasText: itemName });
    // Le bouton supprimer est après les boutons +/-
    await item.locator('button').last().click();
  }

  async emptyCart() {
    await this.emptyCartButton.click();
  }

  async proceedToCheckout() {
    await this.orderButton.click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async getTotal(): Promise<string> {
    return await this.totalAmount.textContent() || '';
  }

  // Assertions
  async expectToBeVisible() {
    await expect(this.heading).toBeVisible();
  }

  async expectToBeHidden() {
    await expect(this.heading).not.toBeVisible();
  }

  async expectItemInCart(itemName: string) {
    await expect(this.cartItems.filter({ hasText: itemName })).toBeVisible();
  }

  async expectItemNotInCart(itemName: string) {
    await expect(this.cartItems.filter({ hasText: itemName })).not.toBeVisible();
  }

  async expectCartEmpty() {
    const count = await this.getItemCount();
    expect(count).toBe(0);
  }

  async expectCartCount(count: number) {
    const actualCount = await this.getItemCount();
    expect(actualCount).toBe(count);
  }
}
