import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReservationPage extends BasePage {
  // Locators - Form
  private get heading() {
    return this.page.getByRole('heading', { name: 'Reservations', level: 1 });
  }

  private get dateInput() {
    // Date input has placeholder "DD/MM/YYYY"
    return this.page.getByRole('textbox', { name: /DD\/MM\/YYYY/i });
  }

  private get guestCountContainer() {
    // The container with -, count, and + buttons
    return this.page.locator('div').filter({
      has: this.page.getByRole('button', { name: '-', exact: true })
    }).filter({
      has: this.page.getByRole('button', { name: '+', exact: true })
    }).first();
  }

  private get increaseGuestsButton() {
    return this.page.getByRole('button', { name: '+', exact: true });
  }

  private get decreaseGuestsButton() {
    return this.page.getByRole('button', { name: '-', exact: true });
  }

  private get phoneInput() {
    // Phone input has placeholder like "06 12 34 56 78"
    return this.page.getByRole('textbox', { name: /06 12 34 56 78/i });
  }

  private get specialRequestsInput() {
    // Special requests textarea with allergies placeholder
    return this.page.getByRole('textbox', { name: /allergies|special/i });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: /book/i });
  }

  // Time slots
  private get lunchTimeSlots() {
    return this.page.locator('section').filter({ hasText: /lunch/i }).getByRole('button');
  }

  private get dinnerTimeSlots() {
    return this.page.locator('section').filter({ hasText: /dinner/i }).getByRole('button');
  }

  // Tables
  private get tableSection() {
    // The section containing "Select Tables *"
    return this.page.locator('div').filter({ hasText: /Select Tables/i }).first();
  }

  private get availableTables() {
    // Table buttons appear after date/time selection
    return this.tableSection.getByRole('button');
  }

  private get tablesDisabledMessage() {
    return this.page.getByText(/please select a date and time/i);
  }

  // My Reservations section
  private get myReservationsSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /my reservations/i })
    });
  }

  private get upcomingTab() {
    return this.page.getByRole('button', { name: /upcoming/i });
  }

  private get pastTab() {
    return this.page.getByRole('button', { name: /past/i });
  }

  private get allTab() {
    return this.page.getByRole('button', { name: /all/i });
  }

  private get reservationCards() {
    return this.myReservationsSection.locator('div').filter({
      has: this.page.getByRole('button', { name: /edit|cancel/i })
    });
  }

  // Actions
  async goto() {
    // First navigate to a public page to let auth initialize
    // This is critical because the app needs to refresh the access token
    // before accessing protected routes
    await super.goto('/menu');

    // Wait for the user button to appear in the navbar
    // This indicates auth has been initialized and user is logged in
    const userButton = this.page.locator('header').getByRole('button').filter({
      hasText: /user|demo|admin/i
    });
    await expect(userButton).toBeVisible({ timeout: 10000 });

    // Wait for network to settle
    await this.page.waitForLoadState('networkidle');

    // Use client-side navigation via clicking the Reservations link
    // This keeps the access token in memory (page.goto would reload and lose it)
    const reservationsLink = this.page.locator('header').getByRole('link', { name: /reservations/i });
    await reservationsLink.click();

    // Wait for navigation to complete
    await this.page.waitForURL(/\/reservations/);
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    // Wait for either the reservations heading OR redirect to login
    // This helps us detect auth failures faster
    try {
      await expect(this.heading).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Check if we were redirected to login
      if (this.page.url().includes('/login')) {
        throw new Error('Authentication failed: redirected to login page. Check storageState is valid and backend is running.');
      }
      throw error;
    }
    await this.page.waitForLoadState('networkidle');
  }

  async selectDate(date: string) {
    // Format expected: YYYY-MM-DD or similar
    await this.dateInput.click();
    await this.dateInput.fill(date);
    // Close date picker if open
    await this.page.keyboard.press('Escape');
  }

  async setGuests(count: number) {
    // Get current count from the container
    const container = this.guestCountContainer;
    const countText = await container.textContent();
    const currentCount = parseInt(countText?.match(/\d+/)?.[0] || '2');

    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        await this.increaseGuestsButton.click();
        // Small delay to let the UI update
        await this.page.waitForTimeout(100);
      }
    } else if (count < currentCount) {
      for (let i = currentCount; i > count; i--) {
        await this.decreaseGuestsButton.click();
        await this.page.waitForTimeout(100);
      }
    }
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async fillSpecialRequests(requests: string) {
    await this.specialRequestsInput.fill(requests);
  }

  async selectTimeSlot(time: string) {
    // Click on the time slot button
    const timeButton = this.page.getByRole('button', { name: time, exact: true });
    await timeButton.click();

    // Wait for the button to show as selected (has primary background)
    await expect(timeButton).toHaveClass(/bg-primary/, { timeout: 5000 });
  }

  async selectLunchSlot(index: number = 0) {
    await this.lunchTimeSlots.nth(index).click();
  }

  async selectDinnerSlot(index: number = 0) {
    await this.dinnerTimeSlots.nth(index).click();
  }

  async selectTable(tableNumber: number) {
    await this.tableSection.getByRole('button', { name: new RegExp(`table.*${tableNumber}|${tableNumber}`, 'i') }).click();
  }

  async selectFirstAvailableTable() {
    // Wait for tables to appear (disabled message should be gone)
    await expect(this.tablesDisabledMessage).not.toBeVisible({ timeout: 5000 });

    // Wait for any loading overlay to disappear
    const loadingOverlay = this.page.locator('.absolute.inset-0.bg-white\\/80');
    await loadingOverlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // Overlay might not exist, that's fine
    });

    // Find an available (not disabled) table button and click it
    // Use :not([disabled]) pseudo-selector to exclude disabled buttons
    const availableTable = this.page.locator('button:not([disabled])').filter({
      hasText: /\d+.*\(\d+p\)/  // Match "1 (2p)" pattern
    }).first();

    await expect(availableTable).toBeEnabled({ timeout: 5000 });
    await availableTable.click();
  }

  async submitReservation() {
    await this.submitButton.click();
  }

  // Full reservation flow
  async makeReservation(options: {
    date: string;
    time: string;
    guests: number;
    phone: string;
    specialRequests?: string;
    tableNumber?: number;
  }) {
    // Fill in form fields
    await this.selectDate(options.date);
    await this.setGuests(options.guests);
    await this.fillPhone(options.phone);

    // Select time slot (this should trigger tables to load)
    await this.selectTimeSlot(options.time);

    // Select table
    if (options.tableNumber) {
      await this.selectTable(options.tableNumber);
    } else {
      await this.selectFirstAvailableTable();
    }

    // Fill special requests if provided
    if (options.specialRequests) {
      await this.fillSpecialRequests(options.specialRequests);
    }

    // Wait for book button to be enabled
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });

    // Submit
    await this.submitReservation();
  }

  // My Reservations actions
  async showUpcomingReservations() {
    await this.upcomingTab.click();
  }

  async showPastReservations() {
    await this.pastTab.click();
  }

  async showAllReservations() {
    await this.allTab.click();
  }

  async getReservationCount(): Promise<number> {
    return this.reservationCards.count();
  }

  async editReservation(index: number = 0) {
    await this.reservationCards.nth(index).getByRole('button', { name: /edit/i }).click();
  }

  async cancelReservation(index: number = 0) {
    await this.reservationCards.nth(index).getByRole('button', { name: /cancel/i }).click();
  }

  async confirmCancellation() {
    // Assuming a confirmation modal appears
    await this.page.getByRole('button', { name: /confirm|yes/i }).click();
  }

  // Assertions
  async expectToBeOnReservationPage() {
    await expect(this.page).toHaveURL(/\/reservations/);
    await expect(this.heading).toBeVisible();
  }

  async expectTimeSlotSelected(time: string) {
    const slot = this.page.getByRole('button', { name: time, exact: true });
    // Selected time slots have primary background color
    await expect(slot).toHaveClass(/bg-primary/);
  }

  async expectTableSelected() {
    // Check that a table is selected (has selected state)
    await expect(this.availableTables.filter({ hasNot: this.page.locator('[aria-pressed="false"]') })).toHaveCount(1);
  }

  async expectReservationSuccess() {
    await expect(
      this.page.getByText(/reservation.*confirmed|successfully.*booked|réservation.*confirmée/i)
    ).toBeVisible({ timeout: 10000 });
  }

  async expectReservationInList(date: string) {
    await expect(this.reservationCards.filter({ hasText: date })).toBeVisible();
  }

  async expectNoReservations() {
    await expect(
      this.page.getByText(/no reservations|aucune réservation/i)
    ).toBeVisible();
  }

  async expectReservationCount(count: number) {
    expect(await this.getReservationCount()).toBe(count);
  }

  async expectFormError(fieldOrMessage: string) {
    await expect(
      this.page.getByRole('alert').filter({ hasText: new RegExp(fieldOrMessage, 'i') })
    ).toBeVisible();
  }

  async expectTablesDisabled() {
    // Tables should show message to select date and time first
    await expect(this.tablesDisabledMessage).toBeVisible();
  }
}
