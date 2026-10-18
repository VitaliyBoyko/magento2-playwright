// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Smoke tests for important pages.
 * This file also checks the HTTP authentication headers are sent.
 */

import type { Page, Response } from '@playwright/test';
import { guestTest as test, expect } from '@utils/fixtures.utils';

import { requireEnv, isBasicAuthChallenge } from '@utils/env.utils';
import { UIReference, slugs } from '@config';

/**
 * Waits for the response to `url`, skipping the HTTP Basic Auth challenge that
 * Firefox exposes as a separate 401 before the authenticated retry.
 * @param page - Playwright page instance the navigation happens in.
 * @param url - Absolute URL or slug, resolved against PLAYWRIGHT_BASE_URL.
 */
function waitForPageResponse(page: Page, url: string): Promise<Response> {
	const expectedUrl = new URL(url, requireEnv('PLAYWRIGHT_BASE_URL')).href;
	return page.waitForResponse(
		(response) => response.url() === expectedUrl && !isBasicAuthChallenge(response),
	);
}

// This local storefront is intentionally accessible without HTTP Basic Auth.
test('Local_storefront_is_accessible_without_HTTP_auth', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	expect(response?.headers()['www-authenticate']).toBeUndefined();
	await expect(
		page.getByRole('heading', { level: 1, name: UIReference.text.frontend.home.title }),
	).toBeVisible();
});

/**
 * Test Group: Smoke tests for critical pages
 *
 * Note that test groups below loop through the pages, but not here.
 * This is because we need to be able to check for different elements on different pages,
 * making it more benificial to write each test separately.
 */
test.describe('Smoke tests for critical pages', () => {
	/**
	 * Test: Confirm the homepage can be reached.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Homepage_returns_200', { tag: ['@smoke', '@cold'] }, async ({ page }) => {
		const homepageURL = requireEnv(`PLAYWRIGHT_BASE_URL`);
		const homepageResponsePromise = waitForPageResponse(page, homepageURL);

		await page.goto(homepageURL);
		const homepageResponse = await homepageResponsePromise;
		expect(homepageResponse.status(), 'Homepage should return 200').toBe(200);

		await expect(
			page.getByRole('heading', { name: UIReference.text.frontend.home.title, level: 1 }),
			'Homepage has a visible title',
		).toBeVisible();
	});

	/**
	 * Test: Confirm a product listing (category) page can be reached.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Plp_returns_200', { tag: ['@smoke', '@cold'] }, async ({ page }) => {
		const plpResponsePromise = waitForPageResponse(page, slugs.frontend.category.index);

		await page.goto(slugs.frontend.category.index);
		const plpResponse = await plpResponsePromise;
		expect(plpResponse.status(), 'PLP should return 200').toBe(200);

		await expect(
			page.getByRole('heading', { name: UIReference.text.frontend.category.title }),
			'PLP has a visible title',
		).toBeVisible();
	});

	/**
	 * Test: Confirm a product detail page can be reached.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Pdp_returns_200', { tag: ['@smoke', '@cold'] }, async ({ page }) => {
		const pdpResponsePromise = waitForPageResponse(page, slugs.frontend.product.simple);

		await page.goto(slugs.frontend.product.simple);
		const pdpResponse = await pdpResponsePromise;
		expect(pdpResponse.status(), 'PDP should return 200').toBe(200);

		await expect(
			page.getByRole('heading', {
				level: 1,
				name: UIReference.text.frontend.product.simpleProduct,
			}),
			'PDP has a visible title',
		).toBeVisible();
	});

	/**
	 * Test: Confirm the checkout can be reached and returns a 302.
	 * Then, the checkout should redirect the user - often to the cart.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Checkout_returns_302_then_redirects', { tag: ['@smoke', '@cold'] }, async ({ page }) => {
		const responsePromise = waitForPageResponse(page, slugs.frontend.checkout.index);

		await page.goto(slugs.frontend.checkout.index);
		const response = await responsePromise;

		expect(response.status(), 'Cart empty, checkout should return 302').toBe(302);
		expect(page.url(), 'Cart empty, checkout should redirect to cart').toContain(
			slugs.frontend.cart.index,
		);

		await expect(
			page.getByRole('heading', { name: UIReference.text.frontend.cart.title }),
			'Cart has a visible title',
		).toBeVisible();

		expect(
			(await page.request.head(page.url())).status(),
			`Current page (${page.url()}) should return 200`,
		).toBe(200);
	});
});

// Compare with committed local baselines; normal runs never rewrite these files.
test.describe('Visual Regression Tests', () => {
	test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
	for (const { label, slug } of [
		{ label: 'homepage', slug: '/' },
		{ label: 'plp', slug: slugs.frontend.category.index },
		{ label: 'pdp', slug: slugs.frontend.product.simple },
		{ label: 'cart', slug: slugs.frontend.cart.index },
	]) {
		test(
			`${label}_matches_visual_baseline`,
			{ tag: ['@smoke', '@visual', '@cold'] },
			async ({ page }) => {
				await page.goto(slug);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				await page.waitForLoadState('networkidle');
				await expect(page).toHaveScreenshot(`${label}.png`, {
					fullPage: true,
					animations: 'disabled',
				});
			},
		);
	}
});
