import { test, guestTest, expect } from '@utils/fixtures.utils';
import { ProductPage } from '@poms/frontend/product.page';
import { CheckoutPage } from '@poms/frontend/checkout.page';
import { UIReference, slugs, inputValues } from '@config';
import type { Page } from '@playwright/test';

async function openCheckout(page: Page) {
	await new ProductPage(page).addSimpleProductToCart(
		UIReference.text.frontend.product.simpleProduct,
		slugs.frontend.product.simple,
	);
	await page.goto(slugs.frontend.checkout.index);
	return new CheckoutPage(page);
}

test('Address_is_pre_filled_in_checkout', { tag: ['@checkout', '@hot'] }, async ({ page }) => {
	await page.goto(slugs.frontend.account.addressBook);
	const savedAddress = page.locator(UIReference.standardCheckout.savedShippingAddress);
	await expect(savedAddress).toBeVisible();
	const normalize = (text: string) =>
		text
			.replace(/\b[TF]:\s*/g, '')
			.replace(/[,\s]+/g, ' ')
			.trim();
	const expectedAddress = normalize(await savedAddress.innerText());
	const checkout = await openCheckout(page);
	await expect
		.poll(async () => normalize(await checkout.selectedAddress.innerText()))
		.toContain(expectedAddress);
});

test('Place_order_for_simple_product', { tag: ['@checkout', '@hot'] }, async ({ page }) => {
	const checkout = await openCheckout(page);
	await expect(await checkout.placeOrder()).toBeVisible();
});

guestTest('Guest_can_select_payment_methods', { tag: ['@checkout', '@hot'] }, async ({ page }) => {
	const checkout = await openCheckout(page);
	await expect(await checkout.placeOrder()).toBeVisible();
});

guestTest(
	'Add_and_remove_coupon_code_in_checkout',
	{ tag: ['@checkout', '@coupon-code'] },
	async ({ page, browserName }) => {
		const checkout = await openCheckout(page);
		await checkout.applyDiscountCodeCheckout(
			inputValues.coupon.codes[browserName.toUpperCase()],
		);
		await checkout.removeDiscountCode();
	},
);

guestTest(
	'Invalid_coupon_code_in_checkout_is_rejected',
	{ tag: ['@checkout', '@coupon-code'] },
	async ({ page }) => {
		const checkout = await openCheckout(page);
		await checkout.enterWrongCouponCode('invalid-local-coverage-coupon');
	},
);

guestTest('Verify_price_calculations_in_checkout', { tag: ['@checkout'] }, async ({ page }) => {
	const checkout = await openCheckout(page);
	await checkout.verifyPriceCalculations();
});
