import { test, expect } from '@playwright/test';
import { MenuPage } from '../../pages/MenuPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { CartModalComponent } from '../../components/CartModalComponent';

test.describe('Order Flow - Complete ordering process', () => {
  let menuPage: MenuPage;
  let checkoutPage: CheckoutPage;
  let cartModal: CartModalComponent;

  test.beforeEach(async ({ page }) => {
    menuPage = new MenuPage(page);
    checkoutPage = new CheckoutPage(page);
    cartModal = new CartModalComponent(page);
  });

  test.describe('Adding items to cart', () => {
    test('should add a single item to cart', async ({ page }) => {
      await menuPage.goto();
      await menuPage.expectToBeOnMenuPage();

      // Add first available item
      const itemCount = await menuPage.getMenuItemsCount();
      expect(itemCount).toBeGreaterThan(0);

      // Get first item and add it
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /add to cart/i })
      });
      await items.first().getByRole('button', { name: /add to cart/i }).click();

      // Open cart and verify
      await menuPage.openCart();
      await cartModal.expectToBeVisible();
    });

    test('should update item quantity in cart', async ({ page }) => {
      await menuPage.goto();

      // Add an item first
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /add to cart/i })
      });
      const firstItem = items.first();
      const itemName = await firstItem.getByRole('heading', { level: 3 }).textContent();

      await firstItem.getByRole('button', { name: /add to cart/i }).click();

      // Open cart
      await menuPage.openCart();
      await cartModal.expectToBeVisible();

      if (itemName) {
        await cartModal.expectItemInCart(itemName);

        // Increase quantity
        await cartModal.increaseItemQuantity(itemName);

        // Verify count changed
        const count = await cartModal.getItemCount();
        expect(count).toBeGreaterThanOrEqual(2);
      }
    });

    test('should remove item from cart', async ({ page }) => {
      await menuPage.goto();

      // Add an item
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /add to cart/i })
      });
      const firstItem = items.first();
      const itemName = await firstItem.getByRole('heading', { level: 3 }).textContent();

      await firstItem.getByRole('button', { name: /add to cart/i }).click();

      // Open cart and remove
      await menuPage.openCart();
      await cartModal.expectToBeVisible();

      if (itemName) {
        await cartModal.removeItem(itemName);
        await cartModal.expectItemNotInCart(itemName);
      }
    });

    test('should empty entire cart', async ({ page }) => {
      await menuPage.goto();

      // Add multiple items
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /add to cart/i })
      });

      // Add first two items
      await items.nth(0).getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(300);
      await items.nth(1).getByRole('button', { name: /add to cart/i }).click();

      // Open cart and empty
      await menuPage.openCart();
      await cartModal.expectToBeVisible();
      await cartModal.emptyCart();
      await cartModal.expectCartEmpty();
    });
  });

  test.describe('Checkout - Delivery', () => {
    test.beforeEach(async ({ page }) => {
      // Add item to cart before each checkout test
      await menuPage.goto();
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /add to cart/i })
      });
      await items.first().getByRole('button', { name: /add to cart/i }).click();
    });

    test('should complete delivery order with card payment', async ({ page }) => {
      await menuPage.openCart();
      await cartModal.expectToBeVisible();
      await cartModal.proceedToCheckout();

      await checkoutPage.expectToBeOnCheckoutPage();

      await checkoutPage.completeDeliveryOrder({
        address: {
          street: '123 Test Street',
          city: 'Paris',
          zipCode: '75001',
          phone: '0612345678',
          instructions: 'Ring twice',
        },
        paymentMethod: 'card',
      });

      await checkoutPage.expectOrderConfirmation();
    });

    test('should complete delivery order with cash payment', async ({ page }) => {
      await menuPage.openCart();
      await cartModal.proceedToCheckout();

      await checkoutPage.expectToBeOnCheckoutPage();

      await checkoutPage.completeDeliveryOrder({
        address: {
          street: '456 Demo Avenue',
          city: 'Lyon',
          zipCode: '69001',
          phone: '0698765432',
        },
        paymentMethod: 'cash',
      });

      await checkoutPage.expectOrderConfirmation();
    });

    test('should show delivery address fields when delivery selected', async ({ page }) => {
      await menuPage.openCart();
      await cartModal.proceedToCheckout();

      await checkoutPage.expectToBeOnCheckoutPage();
      await checkoutPage.selectDelivery();
      await checkoutPage.expectDeliverySelected();
      await checkoutPage.expectAddressFieldsVisible();
    });
  });

  test.describe('Checkout - Pickup', () => {
    test.beforeEach(async ({ page }) => {
      await menuPage.goto();
      const items = page.locator('main .grid > div').filter({
        has: page.getByRole('button', { name: /add to cart/i })
      });
      await items.first().getByRole('button', { name: /add to cart/i }).click();
    });

    test('should complete pickup order with card payment', async ({ page }) => {
      await menuPage.openCart();
      await cartModal.proceedToCheckout();

      await checkoutPage.expectToBeOnCheckoutPage();

      await checkoutPage.completePickupOrder({
        phone: '0612345678',
        paymentMethod: 'card',
      });

      await checkoutPage.expectOrderConfirmation();
    });

    test('should complete pickup order with special requests', async ({ page }) => {
      // Note: Cash payment is not available for pickup orders
      await menuPage.openCart();
      await cartModal.proceedToCheckout();

      await checkoutPage.expectToBeOnCheckoutPage();

      await checkoutPage.completePickupOrder({
        phone: '0698765432',
        paymentMethod: 'card',  // Cash not available for pickup
        specialRequests: 'Extra napkins please',
      });

      await checkoutPage.expectOrderConfirmation();
    });

    test('should hide address fields when pickup selected', async ({ page }) => {
      await menuPage.openCart();
      await cartModal.proceedToCheckout();

      await checkoutPage.expectToBeOnCheckoutPage();
      await checkoutPage.selectPickup();
      await checkoutPage.expectPickupSelected();
      await checkoutPage.expectAddressFieldsHidden();
    });
  });
});
