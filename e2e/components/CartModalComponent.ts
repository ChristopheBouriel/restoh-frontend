import { Page, Locator, expect } from '@playwright/test';

export class CartModalComponent {
  constructor(private page: Page) {}

  private get modal() {
    // The cart modal is a fixed positioned div on the right side
    return this.page.locator('.fixed.right-0').filter({
      has: this.page.getByRole('heading', { name: /my cart/i, level: 2 })
    });
  }

  private get heading() {
    return this.page.getByRole('heading', { name: /my cart/i, level: 2 });
  }

  private get closeButton() {
    return this.modal.getByRole('button').filter({ has: this.page.locator('svg') }).first();
  }

  private get cartItemsContainer() {
    // The scrollable container with cart items - look for the container with Empty cart button
    return this.modal.locator('div').filter({
      has: this.page.getByRole('button', { name: 'Empty cart' })
    }).first();
  }

  private cartItemByName(itemName: string) {
    // Find cart item by its heading name
    return this.cartItemsContainer.locator('div').filter({
      has: this.page.getByRole('heading', { level: 3, name: itemName })
    }).first();
  }

  private get cartItems() {
    // All cart items - each has an h3 heading with item name
    return this.cartItemsContainer.locator('div').filter({
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
    const item = this.cartItemByName(itemName);
    // Get all buttons in the item - there are 3: minus, plus, and delete
    // The plus button is the second one (index 1)
    const buttons = item.getByRole('button');
    await buttons.nth(1).click();
  }

  async decreaseItemQuantity(itemName: string) {
    const item = this.cartItemByName(itemName);
    // The minus button is the first one (index 0)
    const buttons = item.getByRole('button');
    await buttons.nth(0).click();
  }

  async removeItem(itemName: string) {
    const item = this.cartItemByName(itemName);
    // The delete button is the last one (index 2)
    const buttons = item.getByRole('button');
    await buttons.nth(2).click();
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
    await expect(this.cartItemByName(itemName)).toBeVisible();
  }

  async expectItemNotInCart(itemName: string) {
    await expect(this.cartItemByName(itemName)).not.toBeVisible();
  }

  async expectCartEmpty() {
    // After emptying, either the modal shows "My Cart (0)" or it closes
    // Check if heading shows 0 items OR modal is closed (no heading visible)
    const isVisible = await this.heading.isVisible().catch(() => false);

    if (isVisible) {
      const count = await this.getItemCount();
      expect(count).toBe(0);
    } else {
      // Modal closed - cart is empty, check navbar cart button has no count badge
      const cartBadge = this.page.locator('header button').first().locator('div').filter({
        hasText: /^[1-9]/
      });
      await expect(cartBadge).not.toBeVisible();
    }
  }

  async expectCartCount(count: number) {
    const actualCount = await this.getItemCount();
    expect(actualCount).toBe(count);
  }
}
