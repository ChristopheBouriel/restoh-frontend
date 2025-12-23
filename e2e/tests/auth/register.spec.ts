import { test, expect } from '../../fixtures/auth.fixture';
import { RegisterPage } from '../../pages/RegisterPage';

// Générer un email unique pour chaque test
const generateUniqueEmail = () => `test-${Date.now()}@example.com`;

test.describe('Register', () => {
  test.describe('UI State', () => {
    test('should display all registration form elements', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.expectToBeOnRegisterPage();
    });

    test('should have terms checkbox unchecked by default', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.expectTermsNotAccepted();
    });
  });

  test.describe('Validation', () => {
    test('should show error when passwords do not match', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.register({
        fullName: 'Test User',
        email: generateUniqueEmail(),
        password: 'password123',
        confirmPassword: 'differentpassword',
        acceptTerms: true,
      });

      // Vérifier qu'on reste sur la page register (validation côté client)
      await expect(unauthenticatedPage).toHaveURL(/\/register/);
    });

    test('should not submit without accepting terms', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.register({
        fullName: 'Test User',
        email: generateUniqueEmail(),
        password: 'password123',
        acceptTerms: false,
      });

      // Vérifier qu'on reste sur la page register
      await expect(unauthenticatedPage).toHaveURL(/\/register/);
    });

    test('should show error for password too short', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.fillFullName('Test User');
      await registerPage.fillEmail(generateUniqueEmail());
      await registerPage.fillPassword('12345'); // Moins de 6 caractères
      await registerPage.fillConfirmPassword('12345');
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Vérifier qu'on reste sur la page register
      await expect(unauthenticatedPage).toHaveURL(/\/register/);
    });

    test('should show error for invalid email format', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.fillFullName('Test User');
      await registerPage.fillEmail('invalid-email');
      await registerPage.fillPassword('password123');
      await registerPage.fillConfirmPassword('password123');
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Vérifier qu'on reste sur la page register
      await expect(unauthenticatedPage).toHaveURL(/\/register/);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to login page', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.goToLogin();

      await expect(unauthenticatedPage).toHaveURL(/\/login/);
    });

    test('should navigate back to home', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.goToHome();

      await expect(unauthenticatedPage).toHaveURL('/');
    });
  });

  // Note: Les tests de registration réussie nécessitent un backend qui accepte les inscriptions
  // et potentiellement un système de vérification email.
  // Ces tests sont commentés car ils créeraient de vrais comptes dans la base de données.
  /*
  test.describe('Successful registration', () => {
    test('should register successfully with valid data', async ({ unauthenticatedPage }) => {
      const registerPage = new RegisterPage(unauthenticatedPage);
      await registerPage.goto();

      await registerPage.registerAndExpectSuccess({
        fullName: 'Test User',
        email: generateUniqueEmail(),
        password: 'password123',
      });
    });
  });
  */
});
