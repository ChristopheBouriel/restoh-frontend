import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { MenuPage } from '../../pages/MenuPage';
import { ReservationPage } from '../../pages/ReservationPage';
import { ContactPage } from '../../pages/ContactPage';
import { NavbarComponent } from '../../components/NavbarComponent';
import { FooterComponent } from '../../components/FooterComponent';

test.describe('Navigation - Site-wide navigation tests', () => {
  let navbar: NavbarComponent;
  let footer: FooterComponent;

  test.beforeEach(async ({ page }) => {
    navbar = new NavbarComponent(page);
    footer = new FooterComponent(page);
  });

  test.describe('Navbar Navigation', () => {
    test('should navigate to menu page', async ({ page }) => {
      await page.goto('/');
      await navbar.expectVisible();

      await navbar.goToMenu();

      const menuPage = new MenuPage(page);
      await menuPage.expectToBeOnMenuPage();
    });

    test('should navigate to reservations page', async ({ page }) => {
      await page.goto('/');

      await navbar.goToReservations();

      const reservationPage = new ReservationPage(page);
      await reservationPage.expectToBeOnReservationPage();
    });

    test('should navigate to contact page', async ({ page }) => {
      await page.goto('/');

      await navbar.goToContact();

      const contactPage = new ContactPage(page);
      await contactPage.expectToBeOnContactPage();
    });

    test('should navigate to home via logo', async ({ page }) => {
      await page.goto('/menu');

      await navbar.goToHome();

      const homePage = new HomePage(page);
      await homePage.expectToBeOnHomePage();
    });

    test('should show user is logged in', async ({ page }) => {
      await page.goto('/');

      await navbar.expectLoggedIn();
    });

    test('should open cart modal', async ({ page }) => {
      await page.goto('/menu');

      await navbar.openCart();

      // Cart modal should be visible
      await expect(
        page.getByRole('heading', { name: /my cart/i })
      ).toBeVisible();
    });
  });

  test.describe('User Menu', () => {
    test('should open user dropdown menu', async ({ page }) => {
      await page.goto('/');

      await navbar.openUserMenu();

      // Dropdown options should be visible
      await expect(
        page.getByRole('menuitem', { name: /profile/i }).or(
          page.getByRole('link', { name: /profile/i })
        )
      ).toBeVisible();
    });

    test('should navigate to profile', async ({ page }) => {
      await page.goto('/');

      await navbar.goToProfile();

      await expect(page).toHaveURL(/\/profile/);
    });

    test('should logout user', async ({ page }) => {
      await page.goto('/');

      await navbar.logout();

      // Should redirect to login or home
      await expect(page).toHaveURL(/\/(login)?$/);
    });
  });

  test.describe('Footer Navigation', () => {
    test('should display footer', async ({ page }) => {
      await page.goto('/');

      await footer.expectVisible();
    });

    test('should display copyright', async ({ page }) => {
      await page.goto('/');

      await footer.expectCopyrightVisible();
    });

    test('should navigate to menu from footer', async ({ page }) => {
      await page.goto('/');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      await footer.goToMenu();

      await expect(page).toHaveURL(/\/menu/);
    });

    test('should navigate to reservations from footer', async ({ page }) => {
      await page.goto('/');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      await footer.goToReservations();

      await expect(page).toHaveURL(/\/reservations/);
    });

    test('should navigate to contact from footer', async ({ page }) => {
      await page.goto('/');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      await footer.goToContact();

      await expect(page).toHaveURL(/\/contact/);
    });
  });

  test.describe('Home Page CTAs', () => {
    test('should display home page', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.expectToBeOnHomePage();
      await homePage.expectHeroVisible();
    });

    test('should have call to action buttons', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.expectCallToActionsVisible();
    });

    test.skip('should navigate to menu from CTA', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.clickViewMenu();

      await expect(page).toHaveURL(/\/menu/);
    });

    test.skip('should navigate to reservations from CTA', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.clickReserveTable();

      await expect(page).toHaveURL(/\/reservations/);
    });
  });
});
