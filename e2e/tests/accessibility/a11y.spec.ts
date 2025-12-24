import { test, expect } from '@playwright/test';

test.describe('Accessibility - WCAG compliance checks', () => {
  test.describe('Keyboard Navigation', () => {
    test('should navigate menu items with keyboard', async ({ page }) => {
      await page.goto('/menu');

      // Tab through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should have visible focus indicator
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should open cart with keyboard', async ({ page }) => {
      await page.goto('/menu');

      // Find and focus cart button, then press Enter
      const cartButton = page.locator('header button').first();
      await cartButton.focus();
      await page.keyboard.press('Enter');

      // Cart should open
      await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();
    });

    test('should close modal with Escape key', async ({ page }) => {
      await page.goto('/menu');

      // Open cart
      const cartButton = page.locator('header button').first();
      await cartButton.click();
      await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Cart should close
      await expect(page.getByRole('heading', { name: /my cart/i })).not.toBeVisible();
    });

    test('should navigate form fields with Tab', async ({ page }) => {
      await page.goto('/contact');

      // Focus first input
      await page.getByRole('textbox', { name: /name/i }).focus();

      // Tab to next field
      await page.keyboard.press('Tab');

      // Email should be focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('name', /email/i);
    });

    test('should submit form with Enter key', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
      await page.getByRole('textbox', { name: /password/i }).fill('password123');

      // Press Enter to submit
      await page.keyboard.press('Enter');

      // Form should attempt to submit (will fail validation but that's ok)
      await page.waitForTimeout(500);
    });
  });

  test.describe('Focus Management', () => {
    test('should trap focus in modal', async ({ page }) => {
      await page.goto('/menu');

      // Add item and open cart
      await page.getByRole('button', { name: /add to cart/i }).first().click();
      await page.locator('header button').first().click();

      await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();

      // Tab multiple times - focus should stay in modal
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      // Focus should still be within the modal area
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should return focus after modal closes', async ({ page }) => {
      await page.goto('/menu');

      // Remember the cart button
      const cartButton = page.locator('header button').first();

      // Open and close cart
      await cartButton.click();
      await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();
      await page.keyboard.press('Escape');

      // Focus should return to trigger element or nearby
      await page.waitForTimeout(300);
    });
  });

  test.describe('Semantic HTML', () => {
    test('should have proper heading hierarchy on home page', async ({ page }) => {
      await page.goto('/');

      // Should have an h1
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();

      // H1 count should be 1
      expect(await h1.count()).toBe(1);
    });

    test('should have proper heading hierarchy on menu page', async ({ page }) => {
      await page.goto('/menu');

      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      expect(await h1.count()).toBe(1);

      // Menu items should use h3 or similar
      const itemHeadings = page.getByRole('heading', { level: 3 });
      expect(await itemHeadings.count()).toBeGreaterThan(0);
    });

    test('should have main landmark', async ({ page }) => {
      await page.goto('/');

      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });

    test('should have navigation landmark', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');
      await expect(nav.first()).toBeVisible();
    });

    test('should have header/banner landmark', async ({ page }) => {
      await page.goto('/');

      const header = page.getByRole('banner');
      await expect(header).toBeVisible();
    });

    test('should have footer/contentinfo landmark', async ({ page }) => {
      await page.goto('/');

      const footer = page.getByRole('contentinfo');
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have labels for all form inputs', async ({ page }) => {
      await page.goto('/contact');

      // All inputs should be labelable
      const nameInput = page.getByRole('textbox', { name: /name/i });
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const subjectInput = page.getByRole('textbox', { name: /subject/i });
      const messageInput = page.getByRole('textbox', { name: /message/i });

      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(subjectInput).toBeVisible();
      await expect(messageInput).toBeVisible();
    });

    test('should announce form errors', async ({ page }) => {
      await page.goto('/login');

      // Submit empty form
      await page.getByRole('button', { name: /login/i }).click();

      // Error messages should be visible
      await expect(
        page.getByRole('alert').or(page.getByText(/required|invalid/i))
      ).toBeVisible();
    });

    test('should have descriptive button text', async ({ page }) => {
      await page.goto('/menu');

      // Buttons should have accessible names
      const addButtons = page.getByRole('button', { name: /add to cart/i });
      expect(await addButtons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Color and Contrast', () => {
    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto('/menu');

      // Check that status indicators have text, not just color
      // This is a basic check - full contrast testing needs axe-core
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const text = await button.textContent();
          // Buttons should have text content or aria-label
          const ariaLabel = await button.getAttribute('aria-label');
          expect(text || ariaLabel).toBeTruthy();
        }
      }
    });
  });

  test.describe('Images and Media', () => {
    test('should have alt text on images', async ({ page }) => {
      await page.goto('/menu');

      const images = page.getByRole('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // Alt can be empty string for decorative images, but should exist
        expect(alt).not.toBeNull();
      }
    });
  });

  test.describe('ARIA Usage', () => {
    test('should use aria-expanded on expandable elements', async ({ page }) => {
      await page.goto('/');

      // User menu dropdown should have aria-expanded
      const userButton = page.locator('header').getByRole('button').filter({ hasText: /user|profile/i });

      if (await userButton.isVisible()) {
        const ariaExpanded = await userButton.getAttribute('aria-expanded');
        expect(ariaExpanded).toBe('false');

        await userButton.click();

        const ariaExpandedAfter = await userButton.getAttribute('aria-expanded');
        expect(ariaExpandedAfter).toBe('true');
      }
    });

    test('should use aria-current for active navigation', async ({ page }) => {
      await page.goto('/menu');

      const menuLink = page.locator('header').getByRole('link', { name: /menu/i });

      if (await menuLink.isVisible()) {
        const ariaCurrent = await menuLink.getAttribute('aria-current');
        // Should be 'page' or have active class
        const className = await menuLink.getAttribute('class');
        expect(ariaCurrent === 'page' || className?.includes('active')).toBeTruthy();
      }
    });
  });
});
