import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminOrdersPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: /orders.*management|manage.*orders/i, level: 1 });
  }

  // Stats cards
  private get statsSection() {
    return this.page.locator('section').filter({
      has: this.page.getByText(/total|revenue/i)
    }).first();
  }

  // Filters
  private get statusFilter() {
    return this.page.getByRole('combobox', { name: /status/i }).or(
      this.page.getByRole('button', { name: /status|all statuses/i })
    );
  }

  private get dateFilter() {
    return this.page.getByRole('textbox', { name: /date/i });
  }

  private get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i });
  }

  private get todayButton() {
    return this.page.getByRole('button', { name: /today/i });
  }

  private get resetButton() {
    return this.page.getByRole('button', { name: /reset|clear/i });
  }

  // Orders table/list
  private get ordersTable() {
    return this.page.getByRole('table').or(
      this.page.locator('div').filter({ has: this.page.getByRole('row') })
    );
  }

  private get orderRows() {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell')
    });
  }

  private get noOrdersMessage() {
    return this.page.getByText(/no orders|aucune commande/i);
  }

  // Actions
  async goto() {
    await super.goto('/admin/orders');
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
  }

  async filterByDate(date: string) {
    await this.dateFilter.fill(date);
  }

  async filterToday() {
    await this.todayButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(300); // Debounce
  }

  async resetFilters() {
    await this.resetButton.click();
  }

  async getOrdersCount(): Promise<number> {
    return this.orderRows.count();
  }

  async getOrderRow(orderIdOrIndex: string | number): Promise<Locator> {
    if (typeof orderIdOrIndex === 'number') {
      return this.orderRows.nth(orderIdOrIndex);
    }
    return this.orderRows.filter({ hasText: orderIdOrIndex });
  }

  async viewOrderDetails(orderIdOrIndex: string | number) {
    const row = await this.getOrderRow(orderIdOrIndex);
    await row.getByRole('button', { name: /view|details/i }).click();
  }

  async updateOrderStatus(orderIdOrIndex: string | number, newStatus: string) {
    const row = await this.getOrderRow(orderIdOrIndex);
    // Find status dropdown or button in the row
    const statusControl = row.getByRole('combobox').or(
      row.getByRole('button', { name: /status|pending|confirmed|preparing|ready|delivered/i })
    );
    await statusControl.click();
    await this.page.getByRole('option', { name: new RegExp(newStatus, 'i') }).click();
  }

  async markOrderAsPaid(orderIdOrIndex: string | number) {
    const row = await this.getOrderRow(orderIdOrIndex);
    await row.getByRole('button', { name: /mark.*paid|paid/i }).click();
  }

  async cancelOrder(orderIdOrIndex: string | number) {
    const row = await this.getOrderRow(orderIdOrIndex);
    await row.getByRole('button', { name: /cancel/i }).click();
    // Confirm cancellation
    await this.page.getByRole('button', { name: /confirm|yes/i }).click();
  }

  // Assertions
  async expectToBeOnOrdersPage() {
    await expect(this.page).toHaveURL(/\/admin\/orders/);
    await expect(this.heading).toBeVisible();
  }

  async expectOrdersVisible(minCount = 1) {
    const count = await this.getOrdersCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  async expectNoOrders() {
    await expect(this.noOrdersMessage).toBeVisible();
  }

  async expectOrderInList(orderId: string) {
    await expect(this.orderRows.filter({ hasText: orderId })).toBeVisible();
  }

  async expectOrderStatus(orderIdOrIndex: string | number, status: string) {
    const row = await this.getOrderRow(orderIdOrIndex);
    await expect(row.getByText(new RegExp(status, 'i'))).toBeVisible();
  }

  async expectStatsVisible() {
    await expect(this.statsSection).toBeVisible();
  }

  async expectStatusUpdateSuccess() {
    await this.expectSuccessToast(/status.*updated|updated/i);
  }

  async expectOrderCancelled() {
    await this.expectSuccessToast(/cancelled|annulée/i);
  }
}
