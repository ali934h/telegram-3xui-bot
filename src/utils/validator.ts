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

export function validateUUID(uuid: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

export function parseClientList(text: string): Array<{ uuid: string; email: string }> {
	const clients: Array<{ uuid: string; email: string }> = [];
	const lines = text.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const parts = trimmed.split(/\s+/);
		if (parts.length < 2) continue;

		const uuid = parts[0].trim();
		const email = parts[1].trim();

		if (!validateUUID(uuid)) {
			console.warn(`Invalid UUID: ${uuid}`);
			continue;
		}

		if (!email) {
			console.warn(`Empty email for UUID: ${uuid}`);
			continue;
		}

		clients.push({ uuid, email });
	}

	return clients;
}
