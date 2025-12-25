import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminOrdersPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: /orders.*management|manage.*orders/i, level: 1 });
  }

  // Stats cards - the stats are in a generic container with paragraphs like "Total orders", "Pending"
  private get statsSection() {
    return this.page.locator('div').filter({
      has: this.page.getByText(/total orders/i)
    }).first();
  }

  // Filters
  private get statusFilter() {
    return this.page.getByRole('button', { name: /all orders|all statuses/i });
  }

  private get dateFilter() {
    return this.page.getByRole('textbox', { name: /date/i });
  }

  private get searchInput() {
    return this.page.getByRole('textbox', { name: /order number|search/i });
  }

  private get todayButton() {
    return this.page.getByRole('button', { name: /today/i });
  }

  private get resetButton() {
    return this.page.getByRole('button', { name: /reset|clear|refresh/i });
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
    // First navigate to a public page to let auth initialize
    await super.goto('/menu');

    // Wait for the user button to appear in the navbar (indicates auth is ready)
    const userButton = this.page.locator('header').getByRole('button').filter({
      hasText: /user|demo|admin/i
    });
    await expect(userButton).toBeVisible({ timeout: 10000 });

    // Wait for network to settle
    await this.page.waitForLoadState('networkidle');

    // Navigate programmatically to preserve access token in memory
    await this.page.evaluate(() => {
      window.history.pushState({}, '', '/admin/orders');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    // Give React Router time to handle the route
    await this.page.waitForTimeout(500);

    await this.page.waitForURL(/\/admin\/orders/);
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    // Wait for dropdown to open and be visible
    await this.page.waitForTimeout(300);
    // The dropdown shows options like "All orders", "Pending", "Confirmed", etc.
    // Look for visible dropdown options that are NOT in a button (table rows have buttons with status)
    // and NOT in a table cell
    const dropdownOption = this.page.locator('div')
      .filter({ hasText: /all orders/i })  // The dropdown contains "All orders" option
      .getByText(new RegExp(`^${status}$`, 'i'))
      .first();
    await dropdownOption.click();
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

  async getModifiableOrderRow(): Promise<Locator | null> {
    // Find a row that has a status dropdown (not delivered or cancelled)
    // These rows have a button with ▼ in the Actions column
    const rows = this.orderRows;
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const statusButton = row.locator('button').filter({ hasText: /▼/ });
      if (await statusButton.count() > 0) {
        return row;
      }
    }
    return null;
  }

  async updateOrderStatus(orderIdOrIndex: string | number, newStatus: string) {
    let row: Locator;

    if (orderIdOrIndex === 0) {
      // Find first modifiable order instead of just first order
      const modifiableRow = await this.getModifiableOrderRow();
      if (!modifiableRow) {
        throw new Error('No modifiable orders found (all orders are delivered or cancelled)');
      }
      row = modifiableRow;
    } else {
      row = await this.getOrderRow(orderIdOrIndex);
    }

    // SimpleSelect: Find the status dropdown button in the Actions column
    // The button text includes status + ▼ (e.g., "Pending ▼", "Confirmed ▼")
    const statusButton = row.locator('button').filter({ hasText: /▼/ }).last();
    await statusButton.click();
    await this.page.waitForTimeout(300); // Wait for dropdown to open

    // The dropdown opens as a div with all options as children
    // Each option is a div with the status text
    // We need to click the visible dropdown option (appears above the button)
    const dropdown = this.page.locator('div.absolute.bg-white.border-2').first();
    const option = dropdown.locator('div').filter({ hasText: new RegExp(`^${newStatus}$`, 'i') }).first();
    await option.click();

    // Wait for the API call and potential page refresh
    await this.page.waitForTimeout(500);
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
