export { slugToRegex } from '@base/utils/url.utils';

export function isLocalhost(url: string): boolean {
	return new URL(url).hostname === 'hyva-coverage.127.0.0.1.nip.io';
}
