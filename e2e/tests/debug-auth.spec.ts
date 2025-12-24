import { test, expect } from '@playwright/test';

test.describe('Debug Auth', () => {
  test('should check auth flow going to menu first', async ({ page }) => {
    // Listen to all network requests
    page.on('request', request => {
      if (request.url().includes('/api/auth')) {
        console.log('>> Request:', request.method(), request.url());
        console.log('   Headers:', JSON.stringify(request.headers(), null, 2));
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/auth')) {
        console.log('<< Response:', response.status(), response.url());
      }
    });

    // Go to menu first (like ordering tests)
    console.log('1. Going to /menu...');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    console.log('   URL after /menu:', page.url());

    // Add an item to cart
    console.log('2. Adding item to cart...');
    const addButton = page.getByRole('button', { name: /add to cart/i }).first();
    await addButton.click();

    // Now go to checkout (protected)
    console.log('3. Going to /checkout...');
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    console.log('   URL after /checkout:', page.url());

    // Check if we're still on checkout
    expect(page.url()).toContain('/checkout');
  });

  test('should check auth flow going directly to reservations', async ({ page }) => {
    // Listen to all network requests
    page.on('request', request => {
      if (request.url().includes('/api/auth') || request.url().includes('/api/reservations')) {
        console.log('>> Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/auth') || response.url().includes('/api/reservations')) {
        console.log('<< Response:', response.status(), response.url());
      }
    });

    // Go directly to reservations (protected)
    console.log('1. Going directly to /reservations...');
    await page.goto('/reservations');
    await page.waitForTimeout(2000);
    console.log('   URL after /reservations:', page.url());

    // Check if we're on reservations or login
    const url = page.url();
    if (url.includes('/login')) {
      console.log('   FAILED: Redirected to login');
    } else {
      console.log('   SUCCESS: Still on reservations');
    }
    expect(url).toContain('/reservations');
  });
});
