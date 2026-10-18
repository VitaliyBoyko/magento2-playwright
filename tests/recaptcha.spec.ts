import fs from 'node:fs';
import path from 'node:path';
import { guestTest as test, expect } from '@utils/fixtures.utils';
import { RecaptchaPage } from '@poms/frontend/recaptcha.page';
import config from '@fixtures/recaptcha.config.json';

for (const variant of config.variants) {
	for (const valid of [true, false]) {
		test(`Recaptcha_${variant}_${valid ? 'success' : 'failure'}_covers_child_templates`, async ({
			page,
		}) => {
			const errors: string[] = [];
			page.on('pageerror', (error) => errors.push(error.message));
			const recaptcha = new RecaptchaPage(page);
			await recaptcha.installRoutes();
			const fixtures: { file: string; variant: string }[] = JSON.parse(
				fs.readFileSync(path.join(config.directory, config.index), 'utf8'),
			);
			const selected = fixtures.filter((fixture) => fixture.variant === variant);
			expect(selected).toHaveLength(10);
			for (const fixture of selected) {
				const response = await recaptcha.open(fixture.file);
				expect(response?.headers()['content-security-policy']).toBe(config.scriptPolicy);
				await recaptcha.validate(valid);
				await expect.poll(async () => (await recaptcha.state()).errors).toBe(valid ? 0 : 1);
				await expect
					.poll(async () => Boolean((await recaptcha.state()).hasCaptchaToken))
					.toBe(valid);
				if (valid) await expect(recaptcha.submitButton).toBeEnabled();
				else await expect(recaptcha.submitButton).toBeDisabled();
			}
			expect(errors).toEqual([]);
		});
	}
}
