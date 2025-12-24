import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  // Locators
  private get heading() {
    return this.page.getByRole('heading', { name: 'Complete your order', level: 1 });
  }

  // Customer info (disabled, pre-filled)
  private get fullNameInput() {
    return this.page.getByRole('textbox').filter({ hasText: /demo user/i }).or(
      this.page.locator('input[disabled]').first()
    );
  }

  private get emailInput() {
    return this.page.getByRole('textbox').filter({ hasText: /@/ });
  }

  // Order type
  private get deliveryRadio() {
    return this.page.getByRole('radio', { name: /delivery/i });
  }

  private get pickupRadio() {
    return this.page.getByRole('radio', { name: /pickup/i });
  }

  // Special requests
  private get specialRequestsInput() {
    return this.page.getByRole('textbox', { name: /special requests/i });
  }

  // Delivery address
  private get streetInput() {
    return this.page.getByRole('textbox', { name: /street/i });
  }

  private get cityInput() {
    return this.page.getByRole('textbox', { name: /city/i });
  }

  private get zipCodeInput() {
    return this.page.getByRole('textbox', { name: /zip code/i });
  }

  private get phoneInput() {
    return this.page.getByRole('textbox', { name: /phone/i });
  }

  private get deliveryInstructionsInput() {
    return this.page.getByRole('textbox', { name: /delivery instructions/i });
  }

  // Payment
  private get cardPaymentRadio() {
    return this.page.getByRole('radio', { name: /credit card/i });
  }

  private get cashPaymentRadio() {
    return this.page.getByRole('radio', { name: /cash/i });
  }

  // Order summary
  private get orderSummary() {
    return this.page.locator('div').filter({
      has: this.page.getByRole('heading', { name: 'Order summary' })
    });
  }

  private get orderButton() {
    return this.page.getByRole('button', { name: /order/i }).last();
  }

  // Actions
  async goto() {
    await super.goto('/checkout');
  }

  async selectDelivery() {
    await this.deliveryRadio.click();
  }

  async selectPickup() {
    await this.pickupRadio.click();
  }

  async fillSpecialRequests(requests: string) {
    await this.specialRequestsInput.fill(requests);
  }

  async fillDeliveryAddress(address: {
    street: string;
    city: string;
    zipCode: string;
    phone: string;
    instructions?: string;
  }) {
    await this.streetInput.fill(address.street);
    await this.cityInput.fill(address.city);
    await this.zipCodeInput.fill(address.zipCode);
    await this.phoneInput.fill(address.phone);
    if (address.instructions) {
      await this.deliveryInstructionsInput.fill(address.instructions);
    }
  }

  async selectCardPayment() {
    await this.cardPaymentRadio.click();
  }

  async selectCashPayment() {
    await this.cashPaymentRadio.click();
  }

  async placeOrder() {
    await this.orderButton.click();
  }

  async getTotal(): Promise<string> {
    const totalText = await this.orderSummary.getByText(/total/i).textContent();
    return totalText || '';
  }

  // Full order flow
  async completeDeliveryOrder(options?: {
    address?: {
      street: string;
      city: string;
      zipCode: string;
      phone: string;
      instructions?: string;
    };
    paymentMethod?: 'card' | 'cash';
    specialRequests?: string;
  }) {
    await this.selectDelivery();

    if (options?.address) {
      await this.fillDeliveryAddress(options.address);
    }

    if (options?.specialRequests) {
      await this.fillSpecialRequests(options.specialRequests);
    }

    if (options?.paymentMethod === 'cash') {
      await this.selectCashPayment();
    } else {
      await this.selectCardPayment();
    }

    await this.placeOrder();
  }

  async completePickupOrder(options?: {
    phone?: string;
    paymentMethod?: 'card' | 'cash';
    specialRequests?: string;
  }) {
    await this.selectPickup();

    if (options?.phone) {
      await this.phoneInput.fill(options.phone);
    }

    if (options?.specialRequests) {
      await this.fillSpecialRequests(options.specialRequests);
    }

    if (options?.paymentMethod === 'cash') {
      await this.selectCashPayment();
    } else {
      await this.selectCardPayment();
    }

    await this.placeOrder();
  }

  // Assertions
  async expectToBeOnCheckoutPage() {
    await expect(this.page).toHaveURL(/\/checkout/);
    await expect(this.heading).toBeVisible();
  }

  async expectDeliverySelected() {
    await expect(this.deliveryRadio).toBeChecked();
  }

  async expectPickupSelected() {
    await expect(this.pickupRadio).toBeChecked();
  }

  async expectCardPaymentSelected() {
    await expect(this.cardPaymentRadio).toBeChecked();
  }

  async expectCashPaymentSelected() {
    await expect(this.cashPaymentRadio).toBeChecked();
  }

  async expectOrderConfirmation() {
    // Après une commande réussie, on devrait voir un message de confirmation
    await expect(
      this.page.getByText(/order confirmed|commande confirmée|thank you/i)
    ).toBeVisible({ timeout: 10000 });
  }

  async expectAddressFieldsVisible() {
    await expect(this.streetInput).toBeVisible();
    await expect(this.cityInput).toBeVisible();
    await expect(this.zipCodeInput).toBeVisible();
  }

  async expectAddressFieldsHidden() {
    await expect(this.streetInput).not.toBeVisible();
  }
}
