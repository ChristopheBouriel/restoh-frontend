import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReservationPage extends BasePage {
  // Locators - Form
  private get heading() {
    return this.page.getByRole('heading', { name: 'Reservations', level: 1 });
  }

  private get dateInput() {
    return this.page.getByRole('textbox', { name: /date/i });
  }

  private get guestCountDisplay() {
    return this.page.locator('text=/\\d+ guests?/i');
  }

  private get increaseGuestsButton() {
    return this.page.getByRole('button', { name: /increase|plus|\+/i }).first();
  }

  private get decreaseGuestsButton() {
    return this.page.getByRole('button', { name: /decrease|minus|-/i }).first();
  }

  private get phoneInput() {
    return this.page.getByRole('textbox', { name: /phone/i });
  }

  private get specialRequestsInput() {
    return this.page.getByRole('textbox', { name: /special requests/i });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: /confirm|book|reserve/i });
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
    return this.page.locator('section').filter({ hasText: /select.*table/i });
  }

  private get availableTables() {
    return this.tableSection.getByRole('button');
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
    await super.goto('/reservations');
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
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
    // First, get current count and adjust
    const currentText = await this.guestCountDisplay.textContent();
    const currentCount = parseInt(currentText?.match(/\d+/)?.[0] || '1');

    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        await this.increaseGuestsButton.click();
      }
    } else if (count < currentCount) {
      for (let i = currentCount; i > count; i--) {
        await this.decreaseGuestsButton.click();
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
    await this.page.getByRole('button', { name: time, exact: true }).click();
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
    await this.availableTables.first().click();
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
    await this.selectDate(options.date);
    await this.setGuests(options.guests);
    await this.fillPhone(options.phone);
    await this.selectTimeSlot(options.time);

    // Wait for tables to load after time selection
    await this.page.waitForTimeout(500);

    if (options.tableNumber) {
      await this.selectTable(options.tableNumber);
    } else {
      await this.selectFirstAvailableTable();
    }

    if (options.specialRequests) {
      await this.fillSpecialRequests(options.specialRequests);
    }

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
    // Selected state could be aria-pressed or a class change
    await expect(slot).toHaveAttribute('aria-pressed', 'true').or(
      expect(slot).toHaveClass(/selected|active|bg-primary/i)
    );
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
    // Tables should be disabled until date and time are selected
    await expect(this.tableSection.getByText(/select.*date.*time|please.*select/i)).toBeVisible();
  }
}
