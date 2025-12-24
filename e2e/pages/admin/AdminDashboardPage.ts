import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminDashboardPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: /dashboard|admin/i, level: 1 });
  }

  // Quick stats cards
  private get todayRevenueCard() {
    return this.page.locator('div').filter({ hasText: /today.*revenue|revenue.*today/i }).first();
  }

  private get todayOrdersCard() {
    return this.page.locator('div').filter({ hasText: /today.*orders|orders.*today/i }).first();
  }

  private get todayReservationsCard() {
    return this.page.locator('div').filter({ hasText: /today.*reservations|reservations.*today/i }).first();
  }

  private get activeUsersCard() {
    return this.page.locator('div').filter({ hasText: /active.*users|users.*active/i }).first();
  }

  // Navigation tabs/links
  private get ordersTab() {
    return this.page.getByRole('link', { name: /orders/i }).or(
      this.page.getByRole('button', { name: /orders/i })
    );
  }

  private get reservationsTab() {
    return this.page.getByRole('link', { name: /reservations/i }).or(
      this.page.getByRole('button', { name: /reservations/i })
    );
  }

  private get menuTab() {
    return this.page.getByRole('link', { name: /menu/i }).or(
      this.page.getByRole('button', { name: /menu/i })
    );
  }

  private get usersTab() {
    return this.page.getByRole('link', { name: /users/i }).or(
      this.page.getByRole('button', { name: /users/i })
    );
  }

  private get contactsTab() {
    return this.page.getByRole('link', { name: /contacts|messages/i }).or(
      this.page.getByRole('button', { name: /contacts|messages/i })
    );
  }

  // Recent activity sections
  private get recentOrdersSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /recent.*orders/i })
    });
  }

  private get recentReservationsSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /recent.*reservations/i })
    });
  }

  // Actions
  async goto() {
    await super.goto('/admin');
    await this.waitForDashboardLoaded();
  }

  async waitForDashboardLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async goToOrders() {
    await this.ordersTab.click();
  }

  async goToReservations() {
    await this.reservationsTab.click();
  }

  async goToMenu() {
    await this.menuTab.click();
  }

  async goToUsers() {
    await this.usersTab.click();
  }

  async goToContacts() {
    await this.contactsTab.click();
  }

  async getTodayRevenue(): Promise<string> {
    return await this.todayRevenueCard.textContent() || '';
  }

  async getTodayOrdersCount(): Promise<string> {
    return await this.todayOrdersCard.textContent() || '';
  }

  async getTodayReservationsCount(): Promise<string> {
    return await this.todayReservationsCard.textContent() || '';
  }

  // Assertions
  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(/\/admin/);
    await expect(this.heading).toBeVisible();
  }

  async expectQuickStatsVisible() {
    await expect(this.todayRevenueCard.or(this.todayOrdersCard)).toBeVisible();
  }

  async expectNavigationVisible() {
    await expect(this.ordersTab).toBeVisible();
    await expect(this.reservationsTab).toBeVisible();
  }

  async expectRecentActivityVisible() {
    const hasOrders = await this.recentOrdersSection.isVisible();
    const hasReservations = await this.recentReservationsSection.isVisible();
    expect(hasOrders || hasReservations).toBe(true);
  }

  async expectAdminAccess() {
    // Should not show access denied message
    await expect(this.page.getByText(/access denied|unauthorized|forbidden/i)).not.toBeVisible();
  }
}
