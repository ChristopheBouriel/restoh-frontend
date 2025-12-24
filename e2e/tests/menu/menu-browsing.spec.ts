import { test, expect } from '@playwright/test';
import { MenuPage } from '../../pages/MenuPage';

test.describe('Menu Browsing - Viewing and filtering menu items', () => {
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    menuPage = new MenuPage(page);
    await menuPage.goto();
  });

  test.describe('Menu Display', () => {
    test('should display menu page with items', async () => {
      await menuPage.expectToBeOnMenuPage();
      await menuPage.expectMenuItemsVisible();
    });

    test('should display multiple menu items', async () => {
      const count = await menuPage.getMenuItemsCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should show add to cart button on items', async ({ page }) => {
      const addButtons = page.getByRole('button', { name: /add to cart/i });
      await expect(addButtons.first()).toBeVisible();
    });
  });

  test.describe('Search', () => {
    test('should filter items by search term', async () => {
      const initialCount = await menuPage.getMenuItemsCount();

      // Search for a specific term
      await menuPage.search('pizza');
      await menuPage['page'].waitForTimeout(500);

      const filteredCount = await menuPage.getMenuItemsCount();
      // Either items found or no results message
      if (filteredCount > 0) {
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      } else {
        await menuPage.expectNoResults();
      }
    });

    test('should clear search and show all items', async () => {
      await menuPage.search('specific-term');
      await menuPage['page'].waitForTimeout(300);

      await menuPage.clearSearch();
      await menuPage['page'].waitForTimeout(300);

      await menuPage.expectMenuItemsVisible();
    });

    test('should show no results for non-existent item', async () => {
      await menuPage.search('xyznonexistentdish123');
      await menuPage['page'].waitForTimeout(300);

      await menuPage.expectNoResults();
    });
  });

  test.describe('Filters', () => {
    test.skip('should filter by cuisine type', async () => {
      const initialCount = await menuPage.getMenuItemsCount();

      await menuPage.selectCuisine('Italian');
      await menuPage['page'].waitForTimeout(300);

      const filteredCount = await menuPage.getMenuItemsCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test.skip('should filter by category', async () => {
      const initialCount = await menuPage.getMenuItemsCount();

      await menuPage.selectCategory('Main Course');
      await menuPage['page'].waitForTimeout(300);

      const filteredCount = await menuPage.getMenuItemsCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test.skip('should reset all filters', async () => {
      // Apply a filter first
      await menuPage.search('burger');
      await menuPage['page'].waitForTimeout(300);

      await menuPage.resetFilters();
      await menuPage['page'].waitForTimeout(300);

      await menuPage.expectMenuItemsVisible();
    });
  });

  test.describe('Sorting', () => {
    test.skip('should sort by price low to high', async () => {
      await menuPage.sortBy('Price: Low to High');
      await menuPage['page'].waitForTimeout(300);

      // Items should still be visible after sorting
      await menuPage.expectMenuItemsVisible();
    });

    test.skip('should sort by price high to low', async () => {
      await menuPage.sortBy('Price: High to Low');
      await menuPage['page'].waitForTimeout(300);

      await menuPage.expectMenuItemsVisible();
    });
  });

  test.describe('Item Reviews', () => {
    test.skip('should open reviews modal for an item', async ({ page }) => {
      // Get first item with reviews button
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /reviews/i })
      });

      if (await items.count() > 0) {
        const itemName = await items.first().getByRole('heading', { level: 3 }).textContent();
        if (itemName) {
          await menuPage.clickReviewsForItem(itemName);
          const isVisible = await menuPage.isReviewModalVisible();
          expect(isVisible).toBe(true);
        }
      }
    });

    test.skip('should close reviews modal', async ({ page }) => {
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /reviews/i })
      });

      if (await items.count() > 0) {
        const itemName = await items.first().getByRole('heading', { level: 3 }).textContent();
        if (itemName) {
          await menuPage.clickReviewsForItem(itemName);
          await menuPage.closeReviewModal();
          const isVisible = await menuPage.isReviewModalVisible();
          expect(isVisible).toBe(false);
        }
      }
    });
  });
});
