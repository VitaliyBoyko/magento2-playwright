import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import config from '@fixtures/recaptcha.config.json';

declare global {
	interface Window {
		runRecaptchaScenario: (token: string) => void;
		recaptchaScenario: {
			errors: number;
			hasCaptchaToken: number | boolean;
			completed: number;
		};
	}
}

export class RecaptchaPage {
	constructor(public readonly page: Page) {}

	get submitButton() {
		return this.page.locator(config.submitSelector);
	}

	async installRoutes() {
		await this.page.route(config.route, (route) => {
			const file = path.basename(new URL(route.request().url()).pathname);
			return route.fulfill({
				contentType: 'text/html',
				headers: { 'Content-Security-Policy': config.scriptPolicy },
				body: fs.readFileSync(path.join(config.directory, file)),
			});
		});
	}

	async open(file: string) {
		return this.page.goto(config.urlPrefix + file);
	}

	async validate(valid: boolean) {
		await this.page.evaluate(
			(token) => window.runRecaptchaScenario(token),
			valid ? config.token : '',
		);
	}

	async state() {
		return this.page.evaluate(() => window.recaptchaScenario);
	}
}
