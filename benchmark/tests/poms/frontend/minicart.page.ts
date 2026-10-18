import { expect } from '@playwright/test';
import { MiniCartPage as BaseMiniCartPage } from '@base/poms/frontend/minicart.page';
import { UIReference } from '@config';

export class MiniCartPage extends BaseMiniCartPage {
	async goToCheckout() {
		await super.goToCheckout();
		await expect(
			this.page.getByRole('button', {
				name: UIReference.standardCheckout.next,
				exact: true,
			}),
		).toBeVisible({ timeout: 60000 });
	}
}
