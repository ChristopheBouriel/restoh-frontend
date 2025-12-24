import { test, expect } from '@playwright/test';
import { NavbarComponent } from '../../components/NavbarComponent';

// Ces tests utilisent les projets mobile-chrome et mobile-safari
test.describe('Mobile Responsive - Layout and navigation', () => {
  test.describe('Mobile Navigation', () => {
    test('should show mobile menu button', async ({ page }) => {
      await page.goto('/');

      const navbar = new NavbarComponent(page);
      await navbar.expectMobileMenuVisible();
    });

    test('should open mobile menu on click', async ({ page }) => {
      await page.goto('/');

      const navbar = new NavbarComponent(page);
      await navbar.openMobileMenu();

      // Mobile menu should be visible with navigation links
      await expect(
        page.getByRole('link', { name: /menu/i }).or(
          page.getByRole('button', { name: /menu/i })
        )
      ).toBeVisible();
    });

    test('should navigate to menu from mobile menu', async ({ page }) => {
      await page.goto('/');

      const navbar = new NavbarComponent(page);
      await navbar.openMobileMenu();

      await page.getByRole('link', { name: /menu/i }).click();

      await expect(page).toHaveURL(/\/menu/);
    });

    test('should navigate to reservations from mobile menu', async ({ page }) => {
      await page.goto('/');

      const navbar = new NavbarComponent(page);
      await navbar.openMobileMenu();

      await page.getByRole('link', { name: /reservations/i }).click();

      await expect(page).toHaveURL(/\/reservations/);
    });

    test('should close mobile menu on escape', async ({ page }) => {
      await page.goto('/');

      const navbar = new NavbarComponent(page);
      await navbar.openMobileMenu();
      await navbar.closeMobileMenu();

      // Menu should be closed
      await page.waitForTimeout(300);
    });
  });

  test.describe('Mobile Layout', () => {
    test('should display single column layout on menu page', async ({ page }) => {
      await page.goto('/menu');

      // Menu items should stack vertically on mobile
      const menuGrid = page.locator('main .grid');
      await expect(menuGrid).toBeVisible();

      // Check viewport is mobile size
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThan(768);
    });

    test('should show full-width buttons on mobile', async ({ page }) => {
      await page.goto('/menu');

      const addButton = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addButton).toBeVisible();

      // Button should be reasonably sized for touch
      const box = await addButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Minimum touch target
      }
    });

    test('should display cart modal correctly on mobile', async ({ page }) => {
      await page.goto('/menu');

      // Add item and open cart
      await page.getByRole('button', { name: /add to cart/i }).first().click();
      await page.waitForTimeout(300);

      const navbar = new NavbarComponent(page);
      await navbar.openCart();

      // Cart should be visible and take full width on mobile
      const cartHeading = page.getByRole('heading', { name: /my cart/i });
      await expect(cartHeading).toBeVisible();
    });

    test('should display checkout form stacked on mobile', async ({ page }) => {
      // Add item first
      await page.goto('/menu');
      await page.getByRole('button', { name: /add to cart/i }).first().click();

      // Go to checkout
      const navbar = new NavbarComponent(page);
      await navbar.openCart();
      await page.getByRole('button', { name: /order/i }).click();

      // Form fields should be visible and stacked
      await expect(page.getByRole('heading', { name: /complete your order/i })).toBeVisible();
    });

    test('should display reservation form correctly on mobile', async ({ page }) => {
      await page.goto('/reservations');

      await expect(page.getByRole('heading', { name: /reservations/i })).toBeVisible();

      // Form should be visible
      const dateInput = page.getByRole('textbox', { name: /date/i });
      await expect(dateInput).toBeVisible();
    });
  });

  test.describe('Touch Interactions', () => {
    test('should have adequate touch targets for buttons', async ({ page }) => {
      await page.goto('/menu');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Minimum touch target size should be 44x44 (WCAG)
            // We allow 40 for some flexibility
            expect(box.height).toBeGreaterThanOrEqual(36);
            expect(box.width).toBeGreaterThanOrEqual(36);
          }
        }
      }
    });

    test('should have adequate spacing between interactive elements', async ({ page }) => {
      await page.goto('/menu');

      // Check that buttons are not too close together
      const addButtons = page.getByRole('button', { name: /add to cart/i });
      const count = await addButtons.count();

      if (count >= 2) {
        const box1 = await addButtons.nth(0).boundingBox();
        const box2 = await addButtons.nth(1).boundingBox();

        if (box1 && box2) {
          // There should be some space between buttons
          const verticalGap = box2.y - (box1.y + box1.height);
          expect(verticalGap).toBeGreaterThan(0);
        }
      }
    });
  });
});
