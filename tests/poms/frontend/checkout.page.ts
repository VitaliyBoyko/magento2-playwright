// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, slugs, inputValues } from '@config';
import { slugToRegex } from '@utils/url.utils';
import { parsePrice } from '@utils/price.utils';
import MagewireUtils from '@utils/magewire.utils';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';

export class CheckoutPage extends MagewireUtils {
	constructor(public readonly page: Page) {
		super(page);
	}

	// ==============================================
	// Element getters
	// ==============================================

	/**
	 * get contactInfoFields
	 * Returns the form fields associated with the
	 * 'contact information' section of the checkout.
	 */
	get contactInfoFields() {
		return {
			newAddressButton: this.page.getByRole('button', { name: 'New Address' }),
			emailField: this.page.getByLabel(UIReference.text.shared.forms.emailCheckout, {
				exact: true,
			}),
			firstNameField: this.page.getByRole('textbox', {
				name: UIReference.text.shared.forms.firstName,
			}),
			lastNameField: this.page.getByRole('textbox', {
				name: UIReference.text.shared.forms.lastName,
			}),
			streetAddressField: this.page.getByLabel(UIReference.text.shared.forms.streetAddress, {
				exact: true,
			}),
			zipCodeField: this.page.getByLabel(UIReference.text.shared.forms.zipCode),
			cityField: this.page.getByLabel(UIReference.text.shared.forms.city),
			phoneField: this.page.getByLabel(UIReference.text.shared.forms.phone),
			countrySelector: this.page.getByLabel(UIReference.text.shared.forms.country),
			stateDropDown: this.page.getByLabel(UIReference.text.shared.forms.province),
			regionInputField: this.page.getByRole('textbox', {
				name: UIReference.text.shared.forms.province,
			}),
		};
	}

	/**
	 * get shippingFields
	 * Returns the elements from the shipping section of the checkout.
	 */
	get shippingFields() {
		return {
			shippingMethodOptionFixed: this.page.getByLabel(
				UIReference.text.frontend.checkout.shippingFixed,
			),
			shippingMethodTableRateFixed: this.page.getByLabel(
				UIReference.text.frontend.checkout.shippingTableRate,
			),
		};
	}

	/**
	 * get paymentFields
	 * Returns the elements from the payment section of the checkout.
	 */
	get paymentFields() {
		return {
			paymentMethodOptionCheck: this.page.getByRole('radio', {
				name: UIReference.text.frontend.checkout.paymentCheck,
			}),
			paymentMethodOptionCreditCard: this.page.getByLabel(
				UIReference.text.frontend.checkout.paymentCreditCard,
			),
			paymentMethodOptionPaypal: this.page.getByLabel(
				UIReference.text.frontend.checkout.paymentPaypal,
			),
			creditCardNumberField: this.page.getByLabel(
				UIReference.text.frontend.checkout.creditCardNumber,
			),
			creditCardExpiryField: this.page.getByLabel(
				UIReference.text.frontend.checkout.creditCardExpiry,
			),
			creditCardCVVField: this.page.getByLabel(
				UIReference.text.frontend.checkout.creditCardCVV,
			),
			creditCardNameField: this.page.getByLabel(
				UIReference.text.frontend.checkout.creditCardName,
			),
		};
	}

	/**
	 * get orderSummaryFields
	 * Returns the elements from the summary section of the checkout.
	 */
	get orderSummaryFields() {
		return {
			subtotalElement: this.page.getByText(
				`${UIReference.text.frontend.common.subtotal} ${UIReference.text.frontend.common.priceSymbol}`,
			),
			shippingElement: this.page.getByText(
				`${UIReference.text.frontend.checkout.shippingPrice} ${UIReference.text.frontend.common.priceSymbol}`,
			),
			taxElement: this.page.getByText(
				`${UIReference.text.frontend.checkout.tax} ${UIReference.text.frontend.common.priceSymbol}`,
			),
			grandTotalElement: this.page.getByText(
				`${UIReference.text.frontend.common.grandTotal} ${UIReference.text.frontend.common.priceSymbol}`,
			),
			placeOrderButton: this.page.getByRole('button', {
				name: UIReference.text.frontend.checkout.placeOrder,
			}),
		};
	}

	/**
	 * get discountFormFields
	 * Returns locators from the discount form in the checkout
	 */
	get discountFormFields() {
		return {
			openFormButton: this.page.getByRole('button', {
				name: UIReference.text.frontend.common.applyDiscountCode,
			}),
			codeInputField: this.page.getByPlaceholder(
				UIReference.text.frontend.common.discountInput,
			),
			applyCodeButton: this.page.getByRole('button', {
				name: UIReference.text.frontend.checkout.applyCoupon,
			}),
			discountBox: this.page.getByRole('textbox', {
				name: UIReference.text.frontend.cart.discountBox,
			}),
			cancelCouponButton: this.page.getByRole('button', {
				name: UIReference.text.frontend.common.cancelCoupon,
			}),
		};
	}

	/**
	 * get continueShoppingButton
	 * Returns locator for the link element to continue shopping.
	 * This is visible after an order has been placed.
	 */
	get continueShoppingButton() {
		return this.page.getByRole('link', {
			name: UIReference.text.frontend.checkout.continueShopping,
		});
	}

	// ==============================================
	// Order-related methods
	// ==============================================

	/**
	 * Function to place order for a test user.
	 * @returns {string} Ordernumber - the order to confirm the test with
	 */
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

	/**
	 * Clicks 'Place Order' and waits for the success page.
	 *
	 * Magewire can swallow the click: while it re-renders the summary block the
	 * button node is replaced, no order request is sent and the page never
	 * navigates. That is invisible in the DOM - no error message, button still
	 * enabled - so detect it by the missing navigation, let the cascade settle
	 * and click again.
	 * @param attempts {number} - how many times to submit before giving up.
	 */
	protected async submitOrder(attempts: number = 3) {
		const requestWindow = 2000; // a registered click posts well inside this
		const successUrl = slugToRegex(slugs.frontend.checkout.success);

		for (let attempt = 1; attempt <= attempts; attempt++) {
			// Start watching before the click, so a fast post cannot be missed.
			const orderRequest = this.page
				.waitForRequest(/\/magewire\//, { timeout: requestWindow })
				.catch(() => null);
			await this.orderSummaryFields.placeOrderButton.click();

			// A click that registered always posts to Magewire. Once it has, the
			// order is on its way: wait it out rather than risk a second order.
			if ((await orderRequest) || successUrl.test(this.page.url())) {
				await this.page.waitForURL(successUrl);
				return;
			}

			// No post at all - the click was swallowed by a Magewire re-render.
			await this.waitForMagewireRequests();
		}

		throw new Error(
			`[Checkout] 'Place Order' produced no order request after ${attempts} attempts`,
		);
	}

	// ==============================================
	// Discount-related methods
	// ==============================================

	/**
	 * Method to apply a discount code in the checkout
	 * @param code {string} - the discount code to use
	 */
	async applyDiscountCodeCheckout(code: string) {
		await this.openDiscount();
		await this.page.locator(this.ui.discount).fill(code);
		await this.page.getByRole('button', { name: this.ui.applyDiscount, exact: true }).click();
		await expect(
			this.page.getByRole('button', { name: this.ui.cancelDiscount, exact: true }),
		).toBeVisible();
		await expect(this.page.locator(this.ui.discount)).toBeDisabled();
	}

	/**
	 * Method to fill in an incorrect discount code to confirm that does not work
	 * Used in the test 'Invalid_coupon_code_in_checkout_is_rejected'.
	 * @param code {string} - incorrect code to use.
	 */
	async enterWrongCouponCode(code: string) {
		await this.openDiscount();
		await this.page.locator(this.ui.discount).fill(code);
		await this.page.getByRole('button', { name: this.ui.applyDiscount, exact: true }).click();
		await expect(this.page.getByText(/coupon code isn't valid/i)).toBeVisible();
		await expect(this.page.locator(this.ui.discount)).toBeEnabled();
	}

	/**
	 * Method to remove discount code in checkout.
	 * Used in the test Remove_coupon_code_from_checkout
	 */
	async removeDiscountCode() {
		await this.page.getByRole('button', { name: this.ui.cancelDiscount, exact: true }).click();
		await expect(this.page.locator(this.ui.discount)).toBeEnabled();
	}

	// ==============================================
	// Price summary methods
	// ==============================================

	async getPriceValue(element: Locator): Promise<number> {
		return parsePrice(await element.innerText());
	}

	/**
	 * Method to verify the price calculations the checkout has made.
	 * Checks the separate values and performs calculations,
	 * then confoirms the calculated total equals the total shown on page.
	 */
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

	/**
	 * Method to select a payment method in the checkout
	 * @param method  {string} - the payment method a guest/user can select.
	 */
	async selectPaymentMethod(method: 'check' | 'creditcard' | 'paypal'): Promise<void> {
		// Simplify paymentField variables
		const {
			paymentMethodOptionCheck,
			paymentMethodOptionCreditCard,
			paymentMethodOptionPaypal,
			creditCardNumberField,
			creditCardExpiryField,
			creditCardCVVField,
			creditCardNameField,
		} = this.paymentFields;

		// switch based on the payment method that was used as input.
		switch (method) {
			case 'check':
				await paymentMethodOptionCheck.check();
				break;
			case 'creditcard':
				await paymentMethodOptionCreditCard.check();
				// Fill credit card details
				await creditCardNumberField.fill(
					inputValues.payment?.creditCard?.number || '4111111111111111',
				);
				await creditCardExpiryField.fill(
					inputValues.payment?.creditCard?.expiry || '12/25',
				);
				await creditCardCVVField.fill(inputValues.payment?.creditCard?.cvv || '123');
				await creditCardNameField.fill(
					inputValues.payment?.creditCard?.name || 'Test User',
				);
				break;
			case 'paypal':
				await paymentMethodOptionPaypal.check();
				break;
		}

		await this.waitForMagewireRequests();
	}

	/**
	 * Method to select a shipping method in the checkout
	 * @param method  {string} - the payment method a guest/user can select.
	 */
	async selectShippingMethod(method: 'fixed' | 'table rate'): Promise<void> {
		switch (method) {
			case 'fixed':
				await this.shippingFields.shippingMethodOptionFixed.check();
				break;
			case 'table rate':
				await this.shippingFields.shippingMethodTableRateFixed.check();
				break;
		}

		await this.waitForMagewireRequests();
	}

	/**
	 * Method to fill in the shipping address.
	 * Fills in all fields, then selects a country from a pre made list (3, see input-values.json)
	 * If that country is USA, then the state field is a dropdown.
	 * If it's a different country, then the state field is an input field.
	 */
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

	get ui() {
		return UIReference.standardCheckout;
	}

	get selectedAddress() {
		return this.page.locator(this.ui.selectedAddress);
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

	async openDiscount() {
		await this.proceedToPayment();
		if (!(await this.page.locator(this.ui.discount).isVisible()))
			await this.page.locator(this.ui.discountToggle).click();
	}
}
