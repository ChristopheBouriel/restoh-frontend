import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Locators
  private get heroSection() {
    return this.page.locator('section').first();
  }

  private get heroHeading() {
    return this.page.getByRole('heading', { level: 1 }).first();
  }

  private get orderNowButton() {
    return this.page.getByRole('link', { name: /order now|commander/i });
  }

  private get reserveTableButton() {
    return this.page.getByRole('link', { name: /reserve|réserver/i });
  }

  private get viewMenuButton() {
    return this.page.getByRole('link', { name: /view menu|voir le menu/i });
  }

  // Featured dishes section
  private get featuredSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /featured|popular|specialties/i })
    });
  }

  private get featuredDishes() {
    return this.featuredSection.locator('div').filter({
      has: this.page.getByRole('heading', { level: 3 })
    });
  }

  // About section
  private get aboutSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /about|notre histoire/i })
    });
  }

  // Testimonials section
  private get testimonialsSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /testimonials|reviews|avis/i })
    });
  }

  // Actions
  async goto() {
    await super.goto('/');
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heroHeading).toBeVisible({ timeout: 10000 });
  }

  async clickOrderNow() {
    await this.orderNowButton.click();
  }

  async clickReserveTable() {
    await this.reserveTableButton.click();
  }

  async clickViewMenu() {
    await this.viewMenuButton.click();
  }

  async getFeaturedDishesCount(): Promise<number> {
    return this.featuredDishes.count();
  }

  async clickFeaturedDish(index: number = 0) {
    await this.featuredDishes.nth(index).click();
  }

  // Assertions
  async expectToBeOnHomePage() {
    const url = this.page.url();
    expect(url.endsWith('/') || url.includes('/home')).toBe(true);
  }

  async expectHeroVisible() {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heroHeading).toBeVisible();
  }

  async expectCallToActionsVisible() {
    const hasOrderNow = await this.orderNowButton.isVisible();
    const hasViewMenu = await this.viewMenuButton.isVisible();
    const hasReserve = await this.reserveTableButton.isVisible();

    expect(hasOrderNow || hasViewMenu || hasReserve).toBe(true);
  }

  async expectFeaturedDishesVisible(minCount = 1) {
    if (await this.featuredSection.isVisible()) {
      const count = await this.getFeaturedDishesCount();
      expect(count).toBeGreaterThanOrEqual(minCount);
    }
  }

  async expectAboutSectionVisible() {
    await expect(this.aboutSection).toBeVisible();
  }

  async expectTestimonialsVisible() {
    await expect(this.testimonialsSection).toBeVisible();
  }
}
