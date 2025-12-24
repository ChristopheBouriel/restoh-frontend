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
    test('should filter by cuisine type', async () => {
      const initialCount = await menuPage.getMenuItemsCount();

      await menuPage.selectCuisine('Lao');
      await menuPage['page'].waitForTimeout(300);

      const filteredCount = await menuPage.getMenuItemsCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      expect(filteredCount).toBeGreaterThan(0);
    });

    test('should filter by category', async () => {
      const initialCount = await menuPage.getMenuItemsCount();

      await menuPage.selectCategory('Main');
      await menuPage['page'].waitForTimeout(300);

      const filteredCount = await menuPage.getMenuItemsCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      expect(filteredCount).toBeGreaterThan(0);
    });

    test('should reset filters by selecting All options', async () => {
      // Apply a filter first
      await menuPage.selectCuisine('Lao');
      await menuPage['page'].waitForTimeout(300);

      const filteredCount = await menuPage.getMenuItemsCount();

      // Reset by selecting "All cuisines"
      await menuPage.selectCuisine('All cuisines');
      await menuPage['page'].waitForTimeout(300);

      const resetCount = await menuPage.getMenuItemsCount();
      expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
    });
  });

  test.describe('Sorting', () => {
    test('should sort by price ascending', async () => {
      await menuPage.sortBy('Price ascending');
      await menuPage['page'].waitForTimeout(300);

      // Items should still be visible after sorting
      await menuPage.expectMenuItemsVisible();
    });

    test('should sort by price descending', async () => {
      await menuPage.sortBy('Price descending');
      await menuPage['page'].waitForTimeout(300);

      await menuPage.expectMenuItemsVisible();
    });
  });

  test.describe('Item Reviews', () => {
    test('should open reviews modal for an item', async ({ page }) => {
      // Click the first Reviews button
      const reviewsButton = page.getByRole('button', { name: 'Reviews' }).first();
      await reviewsButton.click();

      // Modal should be visible with reviews heading
      await expect(
        page.locator('.fixed.inset-0').filter({
          has: page.getByRole('heading', { level: 2 })
        })
      ).toBeVisible();
    });

    test('should close reviews modal', async ({ page }) => {
      // Open reviews modal
      const reviewsButton = page.getByRole('button', { name: 'Reviews' }).first();
      await reviewsButton.click();

      // Wait for modal to be visible
      const modal = page.locator('.fixed.inset-0').filter({
        has: page.getByRole('heading', { level: 2 })
      });
      await expect(modal).toBeVisible();

      // Close the modal using the close button (first button with SVG)
      await modal.getByRole('button').first().click();

      // Modal should not be visible anymore
      await expect(modal).not.toBeVisible();
    });
  });
});
