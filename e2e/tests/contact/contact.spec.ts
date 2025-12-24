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

    test('should display restaurant information', async () => {
      await contactPage.expectRestaurantInfoVisible();
    });
  });

  test.describe('Contact Form', () => {
    test('should submit contact form successfully', async ({ page }) => {
      // For authenticated users, name/email/phone are pre-filled
      // Use Tab to navigate through form fields naturally, triggering validation
      const nameInput = page.getByRole('textbox', { name: /name/i });

      // Start from name field and Tab through to trigger validation on pre-filled fields
      await nameInput.click();
      await page.keyboard.press('Tab'); // to email
      await page.keyboard.press('Tab'); // to phone
      await page.keyboard.press('Tab'); // to subject

      // Fill subject
      await page.keyboard.type('General Inquiry');
      await page.keyboard.press('Tab'); // to message

      // Fill message
      await page.keyboard.type('This is a test message for the restaurant. Looking forward to visiting!');
      await page.keyboard.press('Tab'); // blur message, focus moves to submit

      // Wait for form to be valid and submit
      await expect(page.getByRole('button', { name: /send/i })).toBeEnabled({ timeout: 5000 });
      await page.getByRole('button', { name: /send/i }).click();

      await contactPage.expectMessageSent();
    });

    test('should clear form after successful submission', async ({ page }) => {
      // Use Tab to navigate through form fields naturally
      const nameInput = page.getByRole('textbox', { name: /name/i });

      await nameInput.click();
      await page.keyboard.press('Tab'); // to email
      await page.keyboard.press('Tab'); // to phone
      await page.keyboard.press('Tab'); // to subject

      await page.keyboard.type('Reservation Question');
      await page.keyboard.press('Tab'); // to message

      await page.keyboard.type('I have a question about group reservations for 20 people.');
      await page.keyboard.press('Tab'); // blur message

      await expect(page.getByRole('button', { name: /send/i })).toBeEnabled({ timeout: 5000 });
      await page.getByRole('button', { name: /send/i }).click();

      await contactPage.expectMessageSent();
      // For authenticated users, form resets to pre-filled user data
      // so name/email stay filled, but subject/message clear
      await expect(page.getByRole('textbox', { name: /subject/i })).toHaveValue('');
      await expect(page.getByRole('textbox', { name: /message/i })).toHaveValue('');
    });

    test('should show validation error for empty subject after blur', async ({ page }) => {
      // Message is valid
      await contactPage.fillMessage('This is a valid message with enough characters.');

      // Focus and blur subject to trigger validation
      const subjectInput = page.getByRole('textbox', { name: /subject/i });
      await subjectInput.focus();
      await subjectInput.blur();

      // Should show subject error (specific error message)
      await expect(
        page.getByText('Subject is required')
      ).toBeVisible();
    });

    test('should show validation error for empty message after blur', async ({ page }) => {
      // Subject is valid
      await contactPage.fillSubject('Test Subject');

      // Focus and blur message to trigger validation
      const messageInput = page.getByRole('textbox', { name: /message/i });
      await messageInput.focus();
      await messageInput.blur();

      // Should show message error (specific error message)
      await expect(
        page.getByText('Message is required')
      ).toBeVisible();
    });

    test('should show validation error for short message', async ({ page }) => {
      await contactPage.fillSubject('Test Subject');
      await contactPage.fillMessage('Short');

      // Blur to trigger validation
      const messageInput = page.getByRole('textbox', { name: /message/i });
      await messageInput.blur();

      // Should show minimum length error (specific error message)
      await expect(
        page.getByText(/must be at least 10 characters/i)
      ).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      // Clear and fill with invalid email using keyboard (more reliable)
      const emailInput = page.getByRole('textbox', { name: /email/i });
      await emailInput.click();
      await emailInput.selectText();
      await page.keyboard.type('invalid-email');
      await page.keyboard.press('Tab'); // blur to trigger validation

      await expect(
        page.getByText('Invalid email address')
      ).toBeVisible();
    });

    test('should disable submit button when form is invalid', async ({ page }) => {
      // Clear all required fields
      await page.getByRole('textbox', { name: /subject/i }).clear();
      await page.getByRole('textbox', { name: /message/i }).clear();

      // Submit button should be disabled
      await expect(page.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    test('should enable submit button when form is valid', async ({ page }) => {
      // Use Tab navigation to trigger validation on all fields
      const nameInput = page.getByRole('textbox', { name: /name/i });

      await nameInput.click();
      await page.keyboard.press('Tab'); // to email
      await page.keyboard.press('Tab'); // to phone
      await page.keyboard.press('Tab'); // to subject

      await page.keyboard.type('Test Subject');
      await page.keyboard.press('Tab'); // to message

      await page.keyboard.type('This is a valid message with at least 10 characters.');
      await page.keyboard.press('Tab'); // blur message

      // Submit button should be enabled
      await expect(page.getByRole('button', { name: /send/i })).toBeEnabled({ timeout: 5000 });
    });
  });
});
