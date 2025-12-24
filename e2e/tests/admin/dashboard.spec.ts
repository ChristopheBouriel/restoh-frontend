import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';

// Ces tests utilisent le projet 'admin' avec storageState admin
test.describe('Admin Dashboard', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.goto();
  });

  test.describe('Dashboard Access', () => {
    test('should display admin dashboard', async () => {
      await dashboardPage.expectToBeOnDashboard();
    });

    test('should show admin has access', async () => {
      await dashboardPage.expectAdminAccess();
    });
  });

  test.describe('Quick Stats', () => {
    test('should display quick stats cards', async () => {
      await dashboardPage.expectQuickStatsVisible();
    });

    test('should show today revenue', async () => {
      const revenue = await dashboardPage.getTodayRevenue();
      expect(revenue).toBeTruthy();
    });

    test('should show today orders count', async () => {
      const orders = await dashboardPage.getTodayOrdersCount();
      expect(orders).toBeTruthy();
    });

    test('should show today reservations count', async () => {
      const reservations = await dashboardPage.getTodayReservationsCount();
      expect(reservations).toBeTruthy();
    });
  });

  test.describe('Navigation', () => {
    test('should display navigation tabs/links', async () => {
      await dashboardPage.expectNavigationVisible();
    });

    test('should navigate to orders management', async ({ page }) => {
      await dashboardPage.goToOrders();
      await expect(page).toHaveURL(/\/admin\/orders/);
    });

    test('should navigate to reservations management', async ({ page }) => {
      await dashboardPage.goToReservations();
      await expect(page).toHaveURL(/\/admin\/reservations/);
    });

    test('should navigate to menu management', async ({ page }) => {
      await dashboardPage.goToMenu();
      await expect(page).toHaveURL(/\/admin\/menu/);
    });

    test('should navigate to users management', async ({ page }) => {
      await dashboardPage.goToUsers();
      await expect(page).toHaveURL(/\/admin\/users/);
    });

    test('should navigate to contacts/messages', async ({ page }) => {
      await dashboardPage.goToContacts();
      await expect(page).toHaveURL(/\/admin\/(contacts|messages)/);
    });
  });

  test.describe('Recent Activity', () => {
    test('should display recent activity section', async () => {
      await dashboardPage.expectRecentActivityVisible();
    });
  });
});
