import { test, expect } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login', () => {
  test.describe('Successful login', () => {
    test('should login successfully with valid user credentials', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.loginAndExpectSuccess('demo@test.com', '123456');

      // Vérifier qu'on n'est plus sur /login
      await expect(unauthenticatedPage).not.toHaveURL(/\/login/);
    });

    test('should login successfully with admin credentials', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.loginAndExpectSuccess('admin@restoh.com', 'admin123');

      await expect(unauthenticatedPage).not.toHaveURL(/\/login/);
    });

    test('should remember user with Remember Me checked', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      // Cocher Remember Me avant le login
      await loginPage.login('demo@test.com', '123456', true);

      // Attendre la redirection
      await unauthenticatedPage.waitForURL((url) => !url.pathname.includes('/login'));

      // Vérifier que la session est persistée (le cookie devrait avoir une durée plus longue)
      const cookies = await unauthenticatedPage.context().cookies();
      expect(cookies.length).toBeGreaterThan(0);
    });
  });

  test.describe('Failed login', () => {
    test('should show error with invalid email', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.loginAndExpectError(
        'invalid@email.com',
        'wrongpassword',
        /invalid|incorrect|error/i
      );
    });

    test('should show error with wrong password', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.loginAndExpectError(
        'demo@test.com',
        'wrongpassword',
        /invalid|incorrect|error/i
      );
    });

    test('should show validation error for empty email', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      // Ne remplir que le mot de passe
      await loginPage.fillPassword('123456');
      await loginPage.submit();

      // Vérifier qu'on reste sur la page login (la validation empêche la soumission)
      await expect(unauthenticatedPage).toHaveURL(/\/login/);
    });

    test('should show validation error for empty password', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      // Ne remplir que l'email
      await loginPage.fillEmail('demo@test.com');
      await loginPage.submit();

      // Vérifier qu'on reste sur la page login
      await expect(unauthenticatedPage).toHaveURL(/\/login/);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to register page', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.goToRegister();

      await expect(unauthenticatedPage).toHaveURL(/\/register/);
    });

    test('should navigate to forgot password page', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.goToForgotPassword();

      await expect(unauthenticatedPage).toHaveURL(/\/forgot-password/);
    });

    test('should navigate back to home', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.goToHome();

      await expect(unauthenticatedPage).toHaveURL('/');
    });
  });

  test.describe('UI State', () => {
    test('should display all login form elements', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.expectToBeOnLoginPage();
    });

    test('should have Remember Me unchecked by default', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.goto();

      await loginPage.expectRememberMeUnchecked();
    });
  });
});
