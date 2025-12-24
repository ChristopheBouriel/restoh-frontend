import { test, expect } from '@playwright/test';
import { ReservationPage } from '../../pages/ReservationPage';

test.describe('Reservation Flow - Complete reservation process', () => {
  let reservationPage: ReservationPage;

  // Helper to get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Helper to get date in 7 days
  const getNextWeekDate = (): string => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  test.beforeEach(async ({ page }) => {
    reservationPage = new ReservationPage(page);
    await reservationPage.goto();
  });

  test.describe('Create Reservation', () => {
    test('should display reservation form', async () => {
      await reservationPage.expectToBeOnReservationPage();
    });

    test('should require date and time before selecting table', async ({ page }) => {
      // Tables should be disabled/hidden until date and time are selected
      await reservationPage.expectTablesDisabled();
    });

    test('should create reservation for lunch', async () => {
      const tomorrowDate = getTomorrowDate();

      await reservationPage.makeReservation({
        date: tomorrowDate,
        time: '12:00',
        guests: 2,
        phone: '0612345678',
        specialRequests: 'Window seat please',
      });

      await reservationPage.expectReservationSuccess();
    });

    test('should create reservation for dinner', async () => {
      const tomorrowDate = getTomorrowDate();

      await reservationPage.makeReservation({
        date: tomorrowDate,
        time: '19:00',
        guests: 4,
        phone: '0698765432',
      });

      await reservationPage.expectReservationSuccess();
    });

    test('should create reservation for larger party', async () => {
      const nextWeekDate = getNextWeekDate();

      await reservationPage.makeReservation({
        date: nextWeekDate,
        time: '20:00',
        guests: 6,
        phone: '0612345678',
        specialRequests: 'Birthday celebration',
      });

      await reservationPage.expectReservationSuccess();
    });

    test('should adjust guest count with buttons', async () => {
      await reservationPage.setGuests(4);
      // Verify the count shows 4 guests
      const display = reservationPage['page'].locator('text=/4 guests/i');
      await expect(display).toBeVisible();
    });
  });

  test.describe('My Reservations', () => {
    test('should show upcoming reservations tab', async () => {
      await reservationPage.showUpcomingReservations();
      // Tab should be active (has primary background color)
      await expect(
        reservationPage['page'].getByRole('button', { name: /upcoming/i })
      ).toHaveClass(/bg-primary/);
    });

    test('should show past reservations tab', async () => {
      await reservationPage.showPastReservations();
      // Tab should be active (has primary background color)
      await expect(
        reservationPage['page'].getByRole('button', { name: /past/i })
      ).toHaveClass(/bg-primary/);
    });

    test('should show all reservations tab', async () => {
      await reservationPage.showAllReservations();
      // Tab should be active (has primary background color)
      await expect(
        reservationPage['page'].getByRole('button', { name: /all/i })
      ).toHaveClass(/bg-primary/);
    });
  });

  test.describe('Edit Reservation', () => {
    test('should open edit modal for existing reservation', async ({ page }) => {
      // First show all reservations to find existing ones
      await reservationPage.showAllReservations();
      await page.waitForTimeout(500);

      // Check if there are any reservations
      const count = await reservationPage.getReservationCount();
      if (count === 0) {
        // No reservations to test - this is acceptable
        test.skip();
        return;
      }

      await reservationPage.editReservation(0);
      // Verify edit modal or form appears
      await expect(
        page.getByRole('dialog').or(
          page.getByRole('heading', { name: /edit/i })
        )
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Cancel Reservation', () => {
    test('should cancel existing reservation', async ({ page }) => {
      // First show all reservations to find existing ones
      await reservationPage.showAllReservations();
      await page.waitForTimeout(500);

      // Check if there are any reservations
      const count = await reservationPage.getReservationCount();
      if (count === 0) {
        // No reservations to test - this is acceptable
        test.skip();
        return;
      }

      await reservationPage.cancelReservation(0);
      await reservationPage.confirmCancellation();

      // Should show success message
      await reservationPage.expectSuccessToast(/cancelled|annulée/i);
    });
  });

  test.describe('Form Validation', () => {
    test('should require phone number', async ({ page }) => {
      const tomorrowDate = getTomorrowDate();

      await reservationPage.selectDate(tomorrowDate);
      await reservationPage.setGuests(2);

      // Clear any pre-filled phone number
      const phoneInput = page.getByRole('textbox', { name: /06 12 34 56 78/i });
      await phoneInput.clear();

      await reservationPage.selectTimeSlot('12:00');
      await page.waitForTimeout(500);
      await reservationPage.selectFirstAvailableTable();

      // Book button should be disabled without phone
      const bookButton = page.getByRole('button', { name: /book/i });
      await expect(bookButton).toBeDisabled();
    });

    test('should validate phone format', async ({ page }) => {
      const tomorrowDate = getTomorrowDate();

      await reservationPage.selectDate(tomorrowDate);
      await reservationPage.setGuests(2);

      // Clear and fill with invalid phone
      const phoneInput = page.getByRole('textbox', { name: /06 12 34 56 78/i });
      await phoneInput.clear();
      await phoneInput.fill('invalid');
      await phoneInput.blur();

      await reservationPage.selectTimeSlot('12:00');
      await page.waitForTimeout(500);
      await reservationPage.selectFirstAvailableTable();

      // Try to submit and check for validation error
      const bookButton = page.getByRole('button', { name: /book/i });
      await bookButton.click();

      // Should show phone format error toast
      await expect(
        page.getByText('Invalid phone format (e.g., 06 12 34 56 78)')
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
