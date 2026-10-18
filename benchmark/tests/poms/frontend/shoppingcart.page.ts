import { expect } from '@playwright/test';
import { CartPage as BaseCartPage } from '@base/poms/frontend/shoppingcart.page';
import { UIReference } from '@config';

export class CartPage extends BaseCartPage {
	async getCheckoutValues(productName: string) {
		const ui = UIReference.standardCheckout;
		const summary = this.page.locator(ui.cartSummary);
		await expect(summary).toBeVisible({ timeout: 60000 });
		const product = summary.locator(ui.cartItem).filter({ hasText: productName });
		if (!(await product.isVisible())) await summary.locator(ui.cartToggle).click();
		await expect(product).toBeVisible();
		return [
			(await product.locator(ui.cartItemPrice).innerText()).trim(),
			(await product.locator(ui.cartItemQuantity).innerText()).trim(),
		];
	}
}
