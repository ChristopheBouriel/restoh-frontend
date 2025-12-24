import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Tests d'accessibilité automatisés avec axe-core
 * Détecte les violations WCAG critiques et sérieuses
 */
test.describe('Accessibility - Automated axe-core scans', () => {
  test.describe('Public Pages', () => {
    test('home page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('menu page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/menu');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('contact page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Authenticated Pages', () => {
    test('reservations page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/reservations');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('profile page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('checkout page should have no critical accessibility violations', async ({ page }) => {
      // Add item to cart first
      await page.goto('/menu');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add to cart/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(300);

        // Go to checkout
        await page.locator('header button').first().click();
        await page.getByRole('button', { name: /order/i }).click();

        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const criticalViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations).toEqual([]);
      }
    });
  });

  test.describe('Auth Pages (no auth required)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('register page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Modal Accessibility', () => {
    test('cart modal should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/menu');
      await page.waitForLoadState('networkidle');

      // Add item and open cart
      await page.getByRole('button', { name: /add to cart/i }).first().click();
      await page.waitForTimeout(300);
      await page.locator('header button').first().click();

      await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Detailed Violation Report', () => {
    test('generate full accessibility report for menu page', async ({ page }) => {
      await page.goto('/menu');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log all violations for debugging (not just critical)
      if (accessibilityScanResults.violations.length > 0) {
        console.log('\n=== Accessibility Violations ===');
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}`);
          console.log(`  Description: ${violation.description}`);
          console.log(`  Help: ${violation.helpUrl}`);
          console.log(`  Affected elements: ${violation.nodes.length}`);
          violation.nodes.slice(0, 3).forEach((node) => {
            console.log(`    - ${node.target}`);
          });
        });
      }

      // Only fail on critical/serious
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });
});
