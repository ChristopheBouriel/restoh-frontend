import { test, expect } from '@playwright/test';
import { ContactPage } from '../../pages/ContactPage';

test.describe('Contact Page - Contact form and information', () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test.describe('Page Display', () => {
    test('should display contact page', async () => {
      await contactPage.expectToBeOnContactPage();
    });

    test.skip('should display restaurant information', async () => {
      await contactPage.expectRestaurantInfoVisible();
    });
  });

  test.describe('Contact Form', () => {
    test('should submit contact form successfully', async () => {
      await contactPage.sendMessage({
        name: 'John Doe',
        email: 'john.doe@example.com',
        subject: 'General Inquiry',
        message: 'This is a test message for the restaurant. Looking forward to visiting!',
      });

      await contactPage.expectMessageSent();
    });

    test('should clear form after successful submission', async () => {
      await contactPage.sendMessage({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        subject: 'Reservation Question',
        message: 'I have a question about group reservations for 20 people.',
      });

      await contactPage.expectMessageSent();
      await contactPage.expectFormCleared();
    });

    test('should validate required name field', async ({ page }) => {
      await contactPage.fillEmail('test@example.com');
      await contactPage.fillSubject('Test Subject');
      await contactPage.fillMessage('This is a valid message with enough characters.');
      await contactPage.submit();

      // Should show name error
      await expect(
        page.getByRole('alert').filter({ hasText: /name/i }).or(
          page.getByText(/name.*required|please.*enter.*name/i)
        )
      ).toBeVisible();
    });

    test('should validate required email field', async ({ page }) => {
      await contactPage.fillName('John Doe');
      await contactPage.fillSubject('Test Subject');
      await contactPage.fillMessage('This is a valid message with enough characters.');
      await contactPage.submit();

      await expect(
        page.getByRole('alert').filter({ hasText: /email/i }).or(
          page.getByText(/email.*required|valid.*email/i)
        )
      ).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await contactPage.fillName('John Doe');
      await contactPage.fillEmail('invalid-email');
      await contactPage.fillSubject('Test Subject');
      await contactPage.fillMessage('This is a valid message with enough characters.');
      await contactPage.submit();

      await expect(
        page.getByText(/valid.*email|email.*format/i)
      ).toBeVisible();
    });

    test('should validate required subject field', async ({ page }) => {
      await contactPage.fillName('John Doe');
      await contactPage.fillEmail('john@example.com');
      await contactPage.fillMessage('This is a valid message with enough characters.');
      await contactPage.submit();

      await expect(
        page.getByRole('alert').filter({ hasText: /subject/i }).or(
          page.getByText(/subject.*required/i)
        )
      ).toBeVisible();
    });

    test('should validate required message field', async ({ page }) => {
      await contactPage.fillName('John Doe');
      await contactPage.fillEmail('john@example.com');
      await contactPage.fillSubject('Test Subject');
      await contactPage.submit();

      await expect(
        page.getByRole('alert').filter({ hasText: /message/i }).or(
          page.getByText(/message.*required/i)
        )
      ).toBeVisible();
    });

    test('should validate minimum message length', async ({ page }) => {
      await contactPage.fillName('John Doe');
      await contactPage.fillEmail('john@example.com');
      await contactPage.fillSubject('Test Subject');
      await contactPage.fillMessage('Too short');
      await contactPage.submit();

      await expect(
        page.getByText(/minimum|too short|at least/i)
      ).toBeVisible();
    });
  });
});
