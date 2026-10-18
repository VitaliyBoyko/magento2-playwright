import { expect } from '@playwright/test';
import { CheckoutPage as BaseCheckoutPage } from '@base/poms/frontend/checkout.page';
import { UIReference, inputValues, slugs } from '@config';
import { parsePrice } from '@utils/price.utils';

// The free Hyva theme uses Magento's two-step Luma checkout in this environment.
export class CheckoutPage extends BaseCheckoutPage {
	get ui() {
		return UIReference.standardCheckout;
	}
	get selectedAddress() {
		return this.page.locator(this.ui.selectedAddress);
	}

	async fillShippingAddress() {
		const form = this.page.locator(this.ui.form);
		await expect(form).toBeVisible({ timeout: 60000 });
		const email = this.page.locator(this.ui.email).first();
		if (await email.isVisible()) await email.fill(`checkout-${Date.now()}@example.test`);
		await form.locator(this.ui.firstName).fill(inputValues.account.firstName);
		await form.locator(this.ui.lastName).fill(inputValues.account.lastName);
		await form.locator(this.ui.country).selectOption(inputValues.firstAddress.firstCountryId);
		await form.locator(this.ui.street).fill(inputValues.firstAddress.firstStreetAddressValue);
		await form.locator(this.ui.city).fill(inputValues.firstAddress.firstCityValue);
		await form.locator(this.ui.postcode).fill(inputValues.firstAddress.firstZipCodeValue);
		await form.locator(this.ui.telephone).fill(inputValues.firstAddress.firstPhoneNumberValue);
	}

	async proceedToPayment() {
		await this.page.waitForURL(/checkout\//);
		if (
			await this.page
				.getByRole('button', { name: this.ui.placeOrder, exact: true })
				.isVisible()
		)
			return;
		await expect(
			this.page.getByRole('button', { name: this.ui.next, exact: true }),
		).toBeVisible({ timeout: 60000 });
		// Knockout can show Next before it finishes rendering saved addresses.
		// Wait for the address choice before deciding whether to fill the form.
		await expect
			.poll(
				async () =>
					(await this.selectedAddress.isVisible()) ||
					(await this.page.locator(this.ui.form).isVisible()),
				{ timeout: 60000 },
			)
			.toBe(true);
		if (!(await this.selectedAddress.isVisible())) await this.fillShippingAddress();
		await this.page.locator(this.ui.shipping).check();
		await this.page.getByRole('button', { name: this.ui.next, exact: true }).click();
		await expect(
			this.page.getByRole('button', { name: this.ui.placeOrder, exact: true }),
		).toBeVisible();
	}

	async placeOrder() {
		if (!this.page.url().includes(slugs.frontend.checkout.index))
			await this.page.goto(slugs.frontend.checkout.index);
		await this.proceedToPayment();
		const method = this.page.locator(this.ui.payment);
		if (await method.isVisible()) await method.check();
		await expect(method).toBeChecked();
		await this.page.getByRole('button', { name: this.ui.placeOrder, exact: true }).click();
		await this.page.waitForURL(/checkout\/onepage\/success/);
		await expect(this.page.locator(this.ui.success)).toBeVisible();
		return this.page
			.locator(this.ui.success)
			.locator('p')
			.filter({ hasText: /Your order (?:number|#) is:/ });
	}

	async openDiscount() {
		await this.proceedToPayment();
		if (!(await this.page.locator(this.ui.discount).isVisible()))
			await this.page.locator(this.ui.discountToggle).click();
	}

	async applyDiscountCodeCheckout(code: string) {
		await this.openDiscount();
		await this.page.locator(this.ui.discount).fill(code);
		await this.page.getByRole('button', { name: this.ui.applyDiscount, exact: true }).click();
		await expect(
			this.page.getByRole('button', { name: this.ui.cancelDiscount, exact: true }),
		).toBeVisible();
		await expect(this.page.locator(this.ui.discount)).toBeDisabled();
	}

	async removeDiscountCode() {
		await this.page.getByRole('button', { name: this.ui.cancelDiscount, exact: true }).click();
		await expect(this.page.locator(this.ui.discount)).toBeEnabled();
	}

	async enterWrongCouponCode(code: string) {
		await this.openDiscount();
		await this.page.locator(this.ui.discount).fill(code);
		await this.page.getByRole('button', { name: this.ui.applyDiscount, exact: true }).click();
		await expect(this.page.getByText(/coupon code isn't valid/i)).toBeVisible();
		await expect(this.page.locator(this.ui.discount)).toBeEnabled();
	}

	async verifyPriceCalculations() {
		await this.proceedToPayment();
		const price = async (selector: string) =>
			parsePrice(await this.page.locator(selector).innerText());
		await expect
			.poll(async () =>
				Math.round(
					100 *
						((await price(this.ui.subtotal)) +
							(await price(this.ui.shippingTotal)) -
							(await price(this.ui.grandTotal))),
				),
			)
			.toBe(0);
	}
}
