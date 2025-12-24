import { test, expect } from '../../fixtures/auth.fixture';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../pages/ResetPasswordPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Password Reset Flow', () => {
  test.describe('Forgot Password Page', () => {
    test.describe('Page Display', () => {
      test('should display forgot password form', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.expectToBeOnForgotPasswordPage();
      });

      test('should display page title and description', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await expect(unauthenticatedPage.getByRole('heading', { name: /forgot your password/i })).toBeVisible();
        await expect(unauthenticatedPage.getByText(/enter your email.*reset link/i)).toBeVisible();
      });
    });

    test.describe('Form Submission', () => {
      test('should show success message after submitting valid email', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.requestPasswordReset('demo@test.com');

        // The app always shows success for security (OWASP recommendation)
        await forgotPasswordPage.expectSuccessState();
        await forgotPasswordPage.expectEmailShownInSuccess('demo@test.com');
      });

      test('should show success even for non-existent email (security)', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.requestPasswordReset('nonexistent@email.com');

        // OWASP: Always show success to prevent email enumeration
        await forgotPasswordPage.expectSuccessState();
      });

      test('should show validation error for invalid email format', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.fillEmail('invalid-email');
        // Trigger validation by clicking submit or tabbing away
        await unauthenticatedPage.keyboard.press('Tab');

        await forgotPasswordPage.expectEmailValidationError();
      });

      test('should show validation error for empty email', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        // Try to submit without filling email
        await forgotPasswordPage.submit();

        // Should stay on the same page (validation prevents submission)
        await expect(unauthenticatedPage).toHaveURL(/\/forgot-password/);
      });
    });

    test.describe('Success State Actions', () => {
      test('should allow sending another reset link', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.requestPasswordReset('demo@test.com');
        await forgotPasswordPage.expectSuccessState();

        // Click to send another link
        await forgotPasswordPage.sendAnotherLink();

        // Should be back on the form
        await forgotPasswordPage.expectToBeOnForgotPasswordPage();
      });

      test('should navigate to login from success state', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.requestPasswordReset('demo@test.com');
        await forgotPasswordPage.expectSuccessState();

        await forgotPasswordPage.returnToLogin();

        await expect(unauthenticatedPage).toHaveURL(/\/login/);
      });
    });

    test.describe('Navigation', () => {
      test('should navigate back to login page', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.goBackToLogin();

        await expect(unauthenticatedPage).toHaveURL(/\/login/);
      });

      test('should navigate to home via logo', async ({ unauthenticatedPage }) => {
        const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
        await forgotPasswordPage.goto();

        await forgotPasswordPage.goToHome();

        await expect(unauthenticatedPage).toHaveURL('/');
      });

      test('should be accessible from login page', async ({ unauthenticatedPage }) => {
        const loginPage = new LoginPage(unauthenticatedPage);
        await loginPage.goto();

        await loginPage.goToForgotPassword();

        await expect(unauthenticatedPage).toHaveURL(/\/forgot-password/);
      });
    });
  });

  test.describe('Reset Password Page', () => {
    test.describe('Page Display', () => {
      test('should display reset password form with token', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-test-token');

        await resetPasswordPage.expectToBeOnResetPasswordPage();
      });

      test('should display page title and description', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-test-token');

        await expect(unauthenticatedPage.getByRole('heading', { name: /reset your password/i })).toBeVisible();
        await expect(unauthenticatedPage.getByText(/enter your new password/i)).toBeVisible();
      });
    });

    test.describe('Form Validation', () => {
      test('should show error for empty password', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-test-token');

        // Focus and blur to trigger validation
        await resetPasswordPage.triggerValidation();

        await resetPasswordPage.expectPasswordValidationError();
      });

      test('should show error for password too short', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-test-token');

        await resetPasswordPage.fillPassword('12345'); // Less than 6 characters
        await unauthenticatedPage.keyboard.press('Tab');

        await resetPasswordPage.expectPasswordValidationError(/at least 6 characters/i);
      });

      test('should show error when passwords do not match', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-test-token');

        await resetPasswordPage.fillPassword('newpassword123');
        await resetPasswordPage.fillConfirmPassword('differentpassword');
        await unauthenticatedPage.keyboard.press('Tab');

        await resetPasswordPage.expectPasswordMismatchError();
      });

      test('should allow submission when passwords match', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-test-token');

        await resetPasswordPage.fillPassword('newpassword123');
        await resetPasswordPage.fillConfirmPassword('newpassword123');

        // Submit button should be enabled
        await resetPasswordPage.expectSubmitButtonEnabled();
      });
    });

    test.describe('Password Reset Submission', () => {
      // Note: These tests may fail or skip if the backend isn't running or token is invalid
      // The behavior depends on the backend's handling of the test token

      test('should show error for invalid/expired token', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('invalid-expired-token');

        await resetPasswordPage.resetPassword('newpassword123');

        // Should show an error (token invalid or expired)
        // The exact behavior depends on backend response
        await unauthenticatedPage.waitForTimeout(1000);

        // Check if we're still on reset password page (error occurred)
        // or if there's an error message displayed
        const hasError = await unauthenticatedPage.locator('.bg-red-50, .bg-yellow-50').first().isVisible();
        const stayedOnPage = unauthenticatedPage.url().includes('/reset-password');

        expect(hasError || stayedOnPage).toBeTruthy();
      });

      test.skip('should show success on valid password reset', async ({ unauthenticatedPage }) => {
        // This test is skipped because it requires a valid token from the backend
        // In a real test environment, you would:
        // 1. Call the API to generate a reset token
        // 2. Use that token in the URL
        // 3. Submit the form and verify success

        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('valid-token-from-api');

        await resetPasswordPage.resetPassword('newpassword123');

        await resetPasswordPage.expectSuccessState();
      });
    });

    test.describe('Navigation', () => {
      test('should navigate back to login', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('test-token');

        await resetPasswordPage.goBackToLogin();

        await expect(unauthenticatedPage).toHaveURL(/\/login/);
      });

      test('should navigate to home via logo', async ({ unauthenticatedPage }) => {
        const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
        await resetPasswordPage.goto('test-token');

        await resetPasswordPage.goToHome();

        await expect(unauthenticatedPage).toHaveURL('/');
      });
    });
  });

  test.describe('Full Password Reset Flow', () => {
    test('should complete forgot password request flow', async ({ unauthenticatedPage }) => {
      // Start from login page
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      // Navigate to forgot password
      await loginPage.goToForgotPassword();
      await expect(unauthenticatedPage).toHaveURL(/\/forgot-password/);

      // Request password reset
      const forgotPasswordPage = new ForgotPasswordPage(unauthenticatedPage);
      await forgotPasswordPage.requestPasswordReset('demo@test.com');

      // Verify success state
      await forgotPasswordPage.expectSuccessState();
      await forgotPasswordPage.expectEmailShownInSuccess('demo@test.com');

      // Return to login
      await forgotPasswordPage.returnToLogin();
      await expect(unauthenticatedPage).toHaveURL(/\/login/);
    });

    test.skip('should complete full password reset with valid token', async ({ unauthenticatedPage }) => {
      // This test is skipped because it requires a valid token from the backend
      // In a real E2E test with a test database, you would:
      // 1. Create a user
      // 2. Request password reset via API
      // 3. Extract token from test email service or database
      // 4. Complete the reset flow
      // 5. Login with new password

      const resetPasswordPage = new ResetPasswordPage(unauthenticatedPage);
      await resetPasswordPage.goto('valid-token-from-api');

      await resetPasswordPage.resetPassword('newSecurePassword123');
      await resetPasswordPage.expectSuccessState();

      // After success, should be able to login with new password
      await resetPasswordPage.goToLoginFromSuccess();

      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.loginAndExpectSuccess('demo@test.com', 'newSecurePassword123');
    });
  });
});
