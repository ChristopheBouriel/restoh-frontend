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
      // Tab should be active
      await expect(
        reservationPage['page'].getByRole('button', { name: /upcoming/i })
      ).toHaveAttribute('aria-selected', 'true').or(
        expect(reservationPage['page'].getByRole('button', { name: /upcoming/i })).toHaveClass(/active|selected/i)
      );
    });

    test('should show past reservations tab', async () => {
      await reservationPage.showPastReservations();
      await expect(
        reservationPage['page'].getByRole('button', { name: /past/i })
      ).toHaveAttribute('aria-selected', 'true').or(
        expect(reservationPage['page'].getByRole('button', { name: /past/i })).toHaveClass(/active|selected/i)
      );
    });

    test('should show all reservations tab', async () => {
      await reservationPage.showAllReservations();
      await expect(
        reservationPage['page'].getByRole('button', { name: /all/i })
      ).toHaveAttribute('aria-selected', 'true').or(
        expect(reservationPage['page'].getByRole('button', { name: /all/i })).toHaveClass(/active|selected/i)
      );
    });
  });

  test.describe('Edit Reservation', () => {
    test.skip('should open edit modal for existing reservation', async () => {
      // This test requires an existing reservation
      // Skip if no reservations exist
      const count = await reservationPage.getReservationCount();
      if (count === 0) {
        test.skip();
        return;
      }

      await reservationPage.editReservation(0);
      // Verify edit modal or form appears
      await expect(
        reservationPage['page'].getByRole('dialog').or(
          reservationPage['page'].getByRole('heading', { name: /edit/i })
        )
      ).toBeVisible();
    });
  });

  test.describe('Cancel Reservation', () => {
    test.skip('should cancel existing reservation', async () => {
      // This test requires an existing reservation
      const count = await reservationPage.getReservationCount();
      if (count === 0) {
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
      await reservationPage.selectTimeSlot('12:00');
      await page.waitForTimeout(500);
      await reservationPage.selectFirstAvailableTable();

      // Try to submit without phone
      await reservationPage.submitReservation();

      // Should show error
      await reservationPage.expectFormError('phone');
    });

    test('should validate phone format', async ({ page }) => {
      const tomorrowDate = getTomorrowDate();

      await reservationPage.selectDate(tomorrowDate);
      await reservationPage.setGuests(2);
      await reservationPage.fillPhone('invalid');
      await reservationPage.selectTimeSlot('12:00');
      await page.waitForTimeout(500);
      await reservationPage.selectFirstAvailableTable();

      await reservationPage.submitReservation();

      // Should show phone format error
      await reservationPage.expectFormError('phone');
    });
  });
});
