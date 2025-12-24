import { Page, expect } from '@playwright/test';

export class FooterComponent {
  constructor(private page: Page) {}

  // Locators
  private get footer() {
    return this.page.locator('footer');
  }

  private get copyright() {
    return this.footer.getByText(/© \d{4}/).first();
  }

  private get socialLinks() {
    return this.footer.getByRole('link').filter({
      has: this.page.locator('svg')
    });
  }

  private get facebookLink() {
    return this.footer.getByRole('link', { name: /facebook/i });
  }

  private get instagramLink() {
    return this.footer.getByRole('link', { name: /instagram/i });
  }

  private get twitterLink() {
    return this.footer.getByRole('link', { name: /twitter|x/i });
  }

  // Quick links
  private get menuLink() {
    return this.footer.getByRole('link', { name: /menu/i });
  }

  private get reservationsLink() {
    return this.footer.getByRole('link', { name: /reservations/i });
  }

  private get contactLink() {
    return this.footer.getByRole('link', { name: /contact/i });
  }

  private get privacyLink() {
    return this.footer.getByRole('link', { name: /privacy/i });
  }

  private get termsLink() {
    return this.footer.getByRole('link', { name: /terms/i });
  }

  // Contact info
  private get addressInfo() {
    return this.footer.locator('address').or(
      this.footer.getByText(/street|avenue|road/i)
    );
  }

  private get phoneInfo() {
    return this.footer.getByText(/\+?\d[\d\s-]{8,}/);
  }

  private get emailInfo() {
    return this.footer.getByText(/@/);
  }

  // Actions
  async goToMenu() {
    await this.menuLink.click();
  }

  async goToReservations() {
    await this.reservationsLink.click();
  }

  async goToContact() {
    await this.contactLink.click();
  }

  async goToPrivacy() {
    await this.privacyLink.click();
  }

  async goToTerms() {
    await this.termsLink.click();
  }

  async getSocialLinksCount(): Promise<number> {
    return this.socialLinks.count();
  }

  // Assertions
  async expectVisible() {
    await expect(this.footer).toBeVisible();
  }

  async expectCopyrightVisible() {
    await expect(this.copyright).toBeVisible();
  }

  async expectCurrentYear() {
    const currentYear = new Date().getFullYear().toString();
    await expect(this.copyright).toContainText(currentYear);
  }

  async expectSocialLinksVisible() {
    expect(await this.getSocialLinksCount()).toBeGreaterThan(0);
  }

  async expectQuickLinksVisible() {
    await expect(this.menuLink).toBeVisible();
    await expect(this.reservationsLink).toBeVisible();
    await expect(this.contactLink).toBeVisible();
  }

  async expectContactInfoVisible() {
    await expect(this.addressInfo.or(this.phoneInfo).or(this.emailInfo)).toBeVisible();
  }

  async expectLegalLinksVisible() {
    await expect(this.privacyLink).toBeVisible();
    await expect(this.termsLink).toBeVisible();
  }
}
