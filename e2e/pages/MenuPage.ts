import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MenuPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: 'Our Menu', level: 1 });
  }

  private get searchInput() {
    return this.page.getByPlaceholder('Search for a dish...');
  }

  private get cuisineDropdown() {
    return this.page.getByRole('button', { name: /cuisines/i });
  }

  private get categoryDropdown() {
    return this.page.getByRole('button', { name: /dishes/i });
  }

  private get sortDropdown() {
    return this.page.getByRole('button', { name: /sort by/i });
  }

  private get menuItemCards() {
    return this.page.locator('main .grid > div').filter({
      has: this.page.getByRole('button', { name: /add to cart|unavailable/i })
    });
  }

  private get resetFiltersButton() {
    return this.page.getByRole('button', { name: 'Reset filters' });
  }

  private get noResultsMessage() {
    return this.page.getByText('No dishes found');
  }

  private get cartButton() {
    return this.page.locator('header button').first();
  }

  // Actions
  async goto() {
    await super.goto('/menu');
    await this.waitForMenuLoaded();
  }

  async waitForMenuLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(300); // Debounce
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async selectCuisine(cuisine: string) {
    await this.cuisineDropdown.click();
    await this.page.getByRole('option', { name: cuisine }).click();
  }

  async selectCategory(category: string) {
    await this.categoryDropdown.click();
    await this.page.getByRole('option', { name: category }).click();
  }

  async sortBy(option: string) {
    await this.sortDropdown.click();
    await this.page.getByRole('option', { name: option }).click();
  }

  async resetFilters() {
    await this.resetFiltersButton.click();
  }

  async getMenuItemsCount(): Promise<number> {
    return this.menuItemCards.count();
  }

  async getMenuItemByName(name: string): Promise<Locator> {
    return this.menuItemCards.filter({
      has: this.page.getByRole('heading', { name, level: 3 })
    }).first();
  }

  async addItemToCartByName(itemName: string) {
    const item = await this.getMenuItemByName(itemName);
    await item.getByRole('button', { name: 'Add to cart' }).click();
  }

  async clickReviewsForItem(itemName: string) {
    const item = await this.getMenuItemByName(itemName);
    await item.getByRole('button', { name: 'Reviews' }).click();
  }

  async openCart() {
    await this.cartButton.click();
  }

  // Review Modal
  private get reviewModal() {
    return this.page.locator('.fixed.inset-0').filter({
      has: this.page.getByRole('heading', { level: 2 })
    });
  }

  async isReviewModalVisible(): Promise<boolean> {
    return this.reviewModal.isVisible();
  }

  async closeReviewModal() {
    await this.reviewModal.getByRole('button').filter({
      has: this.page.locator('svg')
    }).first().click();
  }

  async writeReview(rating: number, comment: string) {
    await this.page.getByRole('button', { name: 'Write a Review' }).click();
    // Click stars for rating
    for (let i = 1; i <= rating; i++) {
      await this.page.getByRole('button', { name: `Rate ${i} star` }).click();
    }
    await this.page.locator('textarea').fill(comment);
    await this.page.getByRole('button', { name: /submit|save/i }).click();
  }

  // Assertions
  async expectToBeOnMenuPage() {
    await expect(this.page).toHaveURL(/\/menu/);
    await expect(this.heading).toBeVisible();
  }

  async expectMenuItemsVisible(minCount = 1) {
    const count = await this.getMenuItemsCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }

  async expectItemVisible(itemName: string) {
    const item = await this.getMenuItemByName(itemName);
    await expect(item).toBeVisible();
  }

  async expectItemNotVisible(itemName: string) {
    const item = await this.getMenuItemByName(itemName);
    await expect(item).not.toBeVisible();
  }

  async expectItemAddedToast() {
    await this.expectSuccessToast(/added|ajouté/i);
  }
}
