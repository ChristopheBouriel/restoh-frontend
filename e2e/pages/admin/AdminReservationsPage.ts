import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminReservationsPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: /reservations.*management|manage.*reservations/i, level: 1 });
  }

  // Stats cards - the stats are in a generic container with paragraphs like "Total", "Total guests", etc.
  private get statsSection() {
    return this.page.locator('div').filter({
      has: this.page.getByText(/^total$/i)
    }).filter({
      has: this.page.getByText(/total guests/i)
    }).first();
  }

  // Filters
  private get statusFilter() {
    return this.page.getByRole('button', { name: /all statuses/i });
  }

  private get dateFilter() {
    return this.page.getByRole('textbox', { name: /date/i });
  }

  private get searchInput() {
    return this.page.getByRole('textbox', { name: /reservation|search/i });
  }

  private get todayButton() {
    return this.page.getByRole('button', { name: /today/i });
  }

  private get resetButton() {
    return this.page.getByRole('button', { name: /reset|clear|refresh/i });
  }

  // Reservations table/list
  private get reservationsTable() {
    return this.page.getByRole('table').or(
      this.page.locator('div').filter({ has: this.page.getByRole('row') })
    );
  }

  private get reservationRows() {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell')
    });
  }

  private get noReservationsMessage() {
    return this.page.getByText(/no reservations|aucune réservation/i);
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
      window.history.pushState({}, '', '/admin/reservations');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    // Give React Router time to handle the route
    await this.page.waitForTimeout(500);

    await this.page.waitForURL(/\/admin\/reservations/);
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    // Wait for dropdown to open
    await this.page.waitForTimeout(200);
    // The dropdown shows generic divs with text - look for exact text match
    const dropdown = this.page.locator('div').filter({
      has: this.page.getByText(/all statuses/i)
    }).filter({
      has: this.page.getByText(/confirmed/i)
    }).first();
    await dropdown.getByText(new RegExp(`^${status}$`, 'i')).click();
  }

  async filterByDate(date: string) {
    await this.dateFilter.fill(date);
  }

  async filterToday() {
    await this.todayButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(300);
  }

  async resetFilters() {
    await this.resetButton.click();
  }

  async getReservationsCount(): Promise<number> {
    return this.reservationRows.count();
  }

  async getReservationRow(idOrIndex: string | number): Promise<Locator> {
    if (typeof idOrIndex === 'number') {
      return this.reservationRows.nth(idOrIndex);
    }
    return this.reservationRows.filter({ hasText: idOrIndex });
  }

  async viewReservationDetails(idOrIndex: string | number) {
    const row = await this.getReservationRow(idOrIndex);
    await row.getByRole('button', { name: /view|details/i }).click();
  }

  async updateReservationStatus(idOrIndex: string | number, newStatus: string) {
    const row = await this.getReservationRow(idOrIndex);
    const statusControl = row.getByRole('combobox').or(
      row.getByRole('button', { name: /status|pending|confirmed|seated|completed/i })
    );
    await statusControl.click();
    await this.page.getByRole('option', { name: new RegExp(newStatus, 'i') }).click();
  }

  async confirmReservation(idOrIndex: string | number) {
    await this.updateReservationStatus(idOrIndex, 'confirmed');
  }

  async seatGuests(idOrIndex: string | number) {
    await this.updateReservationStatus(idOrIndex, 'seated');
  }

  async completeReservation(idOrIndex: string | number) {
    await this.updateReservationStatus(idOrIndex, 'completed');
  }

  async cancelReservation(idOrIndex: string | number) {
    const row = await this.getReservationRow(idOrIndex);
    await row.getByRole('button', { name: /cancel/i }).click();
    await this.page.getByRole('button', { name: /confirm|yes/i }).click();
  }

  async editReservation(idOrIndex: string | number) {
    const row = await this.getReservationRow(idOrIndex);
    await row.getByRole('button', { name: /edit/i }).click();
  }

  // Assertions
  async expectToBeOnReservationsPage() {
    await expect(this.page).toHaveURL(/\/admin\/reservations/);
    await expect(this.heading).toBeVisible();
  }

  async expectReservationsVisible(minCount = 1) {
    const count = await this.getReservationsCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  async expectNoReservations() {
    await expect(this.noReservationsMessage).toBeVisible();
  }

  async expectReservationInList(identifier: string) {
    await expect(this.reservationRows.filter({ hasText: identifier })).toBeVisible();
  }

  async expectReservationStatus(idOrIndex: string | number, status: string) {
    const row = await this.getReservationRow(idOrIndex);
    await expect(row.getByText(new RegExp(status, 'i'))).toBeVisible();
  }

  async expectStatsVisible() {
    await expect(this.statsSection).toBeVisible();
  }

  async expectStatusUpdateSuccess() {
    await this.expectSuccessToast(/status.*updated|updated/i);
  }

  async expectReservationCancelled() {
    await this.expectSuccessToast(/cancelled|annulée/i);
  }
}
