import { expect } from '@playwright/test';
import { MainMenuPage as BaseMainMenuPage } from '@base/poms/frontend/mainmenu.page';
import { SearchPage } from '@poms/frontend/search.page';
import { UIReference } from '@config';

export class MainMenuPage extends BaseMainMenuPage {
	async searchForProduct(searchTerm: string) {
		await this.page.goto('/');
		await new SearchPage(this.page).search(searchTerm);
		expect(new URL(this.page.url()).searchParams.get('q')).toBe(searchTerm);
		await expect(
			this.page.getByRole('heading', {
				name: `${UIReference.text.frontend.search.resultsTitle} '${searchTerm}'`,
			}),
		).toBeVisible();
		await expect(
			this.page
				.locator(UIReference.selectors.frontend.category.productGrid)
				.locator('li')
				.first(),
		).toBeVisible();
	}
}
