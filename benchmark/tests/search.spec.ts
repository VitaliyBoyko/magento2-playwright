// @ts-check

import { guestTest as test, expect } from '@utils/fixtures.utils';
import { UIReference, outcomeMarker, inputValues, slugs } from '@config';
import { slugToRegex } from '@utils/url.utils';

import { SearchPage } from '@poms/frontend/search.page';

test.describe('OpenSearch storefront search', () => {
	test('Search_query_returns_multiple_results', async ({ page }) => {
		await page.goto('');
		const searchPage = new SearchPage(page);
		await searchPage.search(inputValues.search.queryMultipleResults);
		await expect(page).toHaveURL(slugToRegex(slugs.frontend.search.results));
		const results = page.locator(`${UIReference.selectors.frontend.category.productGrid} li`);
		const resultCount = await results.count();
		expect(resultCount).toBeGreaterThan(1);
	});

	test('User_can_find_a_specific_product_and_navigate_to_its_page', async ({ page }) => {
		await page.goto('');
		const searchPage = new SearchPage(page);
		await searchPage.search(inputValues.search.querySpecificProduct);

		await page
			.locator(UIReference.selectors.frontend.category.productGrid)
			.getByRole('link', {
				name: UIReference.text.frontend.product.simpleProduct,
				exact: true,
			})
			.filter({ hasText: UIReference.text.frontend.product.simpleProduct })
			.click();
		await expect(page).toHaveURL(slugToRegex(slugs.frontend.product.simple));
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: UIReference.text.frontend.product.simpleProduct,
			}),
		).toBeVisible();
	});

	test('No_results_message_is_shown_for_unknown_query', async ({ page }) => {
		await page.goto('');
		const searchPage = new SearchPage(page);
		await searchPage.search(inputValues.search.queryNoResults);
		await expect(page.getByText(outcomeMarker.search.noResultsMessage)).toBeVisible();
	});
});
