export function validatePanelUrl(url: string): { valid: boolean; error?: string } {
	if (!url || url.trim() === '') {
		return { valid: false, error: 'آدرس پنل نمی‌تواند خالی باشد' };
	}

	try {
		const parsedUrl = new URL(url);

		if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
			return { valid: false, error: 'آدرس باید با http:// یا https:// شروع شود' };
		}

		if (!parsedUrl.hostname) {
			return { valid: false, error: 'آدرس معتبر نیست' };
		}

		return { valid: true };
	} catch (error) {
		return { valid: false, error: 'فرمت آدرس اشتباه است' };
	}
}
