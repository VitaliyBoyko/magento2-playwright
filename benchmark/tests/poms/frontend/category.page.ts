import { expect } from '@playwright/test';
import { CategoryPage as BaseCategoryPage } from '@base/poms/frontend/category.page';
import { UIReference } from '@config';

export class CategoryPage extends BaseCategoryPage {
	async filterOnAttribute() {
		const region = this.categoryFilterItems.filterRegion;
		// Hyva 1.5 uses native details/summary instead of an ARIA button.
		const summary = region
			.getByRole('heading', {
				name: UIReference.text.frontend.category.sizeFilter,
				exact: true,
			})
			.locator('..');
		const option = region.getByRole('link', {
			name: UIReference.text.frontend.category.sizeM,
			exact: true,
		});
		if (!(await option.isVisible())) await summary.click();
		const target = new URL((await option.getAttribute('href'))!, this.page.url());
		const value = target.searchParams.get('size');
		expect(value).toBeTruthy();
		await option.click();
		await this.page.waitForURL((url) => url.searchParams.get('size') === value);
		await expect(this.categoryFilterItems.activeFilteringHeading).toBeVisible();
		const remove = region.getByRole('link', {
			name: UIReference.text.frontend.category.removeSizeM,
			exact: true,
		});
		await expect(remove).toBeVisible();
		await remove.click();
		await this.page.waitForURL((url) => !url.searchParams.has('size'));
		await expect(this.categoryFilterItems.activeFilteringHeading).toBeHidden();
	}
}
