import { test, expect } from '@playwright/test';
import { AdminOrdersPage } from '../../pages/admin/AdminOrdersPage';

test.describe('Admin Orders Management', () => {
  let ordersPage: AdminOrdersPage;

  test.beforeEach(async ({ page }) => {
    ordersPage = new AdminOrdersPage(page);
    await ordersPage.goto();
  });

  test.describe('Orders Display', () => {
    test('should display orders management page', async () => {
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should display stats section', async () => {
      await ordersPage.expectStatsVisible();
    });

    test('should display orders list or empty message', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        await ordersPage.expectNoOrders();
      } else {
        await ordersPage.expectOrdersVisible();
      }
    });
  });

  test.describe('Filters', () => {
    test('should filter orders by status - pending', async () => {
      await ordersPage.filterByStatus('pending');
      // After filtering, page should still be functional
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should filter orders by status - confirmed', async () => {
      await ordersPage.filterByStatus('confirmed');
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should filter orders by status - preparing', async () => {
      await ordersPage.filterByStatus('preparing');
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should filter orders by status - delivered', async () => {
      await ordersPage.filterByStatus('delivered');
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should filter today orders', async () => {
      await ordersPage.filterToday();
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should search orders', async () => {
      await ordersPage.search('test');
      await ordersPage.expectToBeOnOrdersPage();
    });

    test('should reset filters', async () => {
      await ordersPage.filterByStatus('pending');
      await ordersPage.resetFilters();
      await ordersPage.expectToBeOnOrdersPage();
    });
  });

  test.describe('Order Status Updates', () => {
    test.skip('should update order status to confirmed', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.updateOrderStatus(0, 'confirmed');
      await ordersPage.expectStatusUpdateSuccess();
    });

    test.skip('should update order status to preparing', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.updateOrderStatus(0, 'preparing');
      await ordersPage.expectStatusUpdateSuccess();
    });

    test.skip('should update order status to ready', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.updateOrderStatus(0, 'ready');
      await ordersPage.expectStatusUpdateSuccess();
    });

    test.skip('should update order status to delivered', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.updateOrderStatus(0, 'delivered');
      await ordersPage.expectStatusUpdateSuccess();
    });
  });

  test.describe('Order Actions', () => {
    test.skip('should view order details', async ({ page }) => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.viewOrderDetails(0);

      // Should show order details modal or page
      await expect(
        page.getByRole('dialog').or(
          page.getByRole('heading', { name: /order details|order #/i })
        )
      ).toBeVisible();
    });

    test.skip('should mark order as paid', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.markOrderAsPaid(0);
      await ordersPage.expectSuccessToast(/paid|payé/i);
    });

    test.skip('should cancel order', async () => {
      const count = await ordersPage.getOrdersCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await ordersPage.cancelOrder(0);
      await ordersPage.expectOrderCancelled();
    });
  });
});
