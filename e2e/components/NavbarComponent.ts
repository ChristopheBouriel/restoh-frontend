import { Page, Locator, expect } from '@playwright/test';

export class NavbarComponent {
  constructor(private page: Page) {}

  // Locators
  private get navbar() {
    return this.page.locator('header');
  }

  private get logo() {
    return this.navbar.getByRole('link', { name: 'RestOh!' }).first();
  }

  private get menuLink() {
    return this.navbar.getByRole('link', { name: /menu/i });
  }

  private get reservationsLink() {
    return this.navbar.getByRole('link', { name: /reservations/i });
  }

  private get contactLink() {
    return this.navbar.getByRole('link', { name: /contact/i });
  }

  private get cartButton() {
    return this.navbar.getByRole('button').filter({ has: this.page.locator('svg') }).first();
  }

  private get cartBadge() {
    return this.cartButton.locator('span').filter({ hasText: /\d+/ });
  }

  private get userMenuButton() {
    return this.navbar.getByRole('button').filter({ hasText: /user|admin|profile/i });
  }

  private get loginLink() {
    return this.navbar.getByRole('link', { name: /login|sign in/i });
  }

  private get registerLink() {
    return this.navbar.getByRole('link', { name: /register|sign up/i });
  }

  private get profileLink() {
    return this.page.getByRole('link', { name: /my profile|profile/i });
  }

  private get logoutButton() {
    return this.page.getByRole('button', { name: /logout|sign out/i });
  }

  private get adminDashboardLink() {
    return this.page.getByRole('link', { name: /dashboard|admin/i });
  }

  // Mobile menu
  private get mobileMenuButton() {
    return this.navbar.getByRole('button', { name: /menu|hamburger/i });
  }

  private get mobileMenu() {
    return this.page.locator('nav[aria-label="mobile"]').or(
      this.page.locator('.mobile-menu')
    );
  }

  // Actions
  async goToHome() {
    await this.logo.click();
  }

  async goToMenu() {
    await this.menuLink.click();
  }

  async goToReservations() {
    await this.reservationsLink.click();
  }

  async goToContact() {
    await this.contactLink.click();
  }

  async openCart() {
    await this.cartButton.click();
  }

  async getCartCount(): Promise<number> {
    const badge = this.cartBadge;
    if (await badge.isVisible()) {
      const text = await badge.textContent();
      return parseInt(text || '0');
    }
    return 0;
  }

  async openUserMenu() {
    await this.userMenuButton.click();
  }

  async goToProfile() {
    await this.openUserMenu();
    await this.profileLink.click();
  }

  async goToAdminDashboard() {
    await this.openUserMenu();
    await this.adminDashboardLink.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  // Mobile actions
  async openMobileMenu() {
    await this.mobileMenuButton.click();
  }

  async closeMobileMenu() {
    // Click outside or close button
    await this.page.keyboard.press('Escape');
  }

  // Assertions
  async expectVisible() {
    await expect(this.navbar).toBeVisible();
  }

  async expectLoggedIn(userName?: string) {
    await expect(this.userMenuButton).toBeVisible();
    if (userName) {
      await expect(this.userMenuButton).toContainText(userName);
    }
  }

  async expectLoggedOut() {
    await expect(this.loginLink).toBeVisible();
  }

  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toContainText(String(count));
    }
  }

  async expectActiveLink(linkName: 'menu' | 'reservations' | 'contact') {
    const linkMap = {
      menu: this.menuLink,
      reservations: this.reservationsLink,
      contact: this.contactLink,
    };
    // Check for active state (aria-current or class)
    await expect(linkMap[linkName]).toHaveAttribute('aria-current', 'page').or(
      expect(linkMap[linkName]).toHaveClass(/active|current/i)
    );
  }

  async expectAdminMenuVisible() {
    await this.openUserMenu();
    await expect(this.adminDashboardLink).toBeVisible();
  }

  async expectMobileMenuVisible() {
    await expect(this.mobileMenuButton).toBeVisible();
  }

  async expectDesktopMenuVisible() {
    await expect(this.menuLink).toBeVisible();
    await expect(this.reservationsLink).toBeVisible();
  }
}
