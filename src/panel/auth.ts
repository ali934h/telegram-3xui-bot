export async function loginToPanel(
	panelUrl: string,
	username: string,
	password: string
): Promise<string> {
	const url = `${panelUrl.replace(/\/$/, '')}/login`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
	});

	if (!response.ok) {
		throw new Error('نام کاربری یا رمز عبور اشتباه است');
	}

	const result: any = await response.json();

	if (!result.success) {
		throw new Error(result.msg || 'خطا در ورود به پنل');
	}

	const cookies = response.headers.get('set-cookie');
	if (!cookies) {
		throw new Error('Session cookie دریافت نشد');
	}

	const sessionCookie = cookies
		.split(',')
		.map((c) => c.trim())
		.find((c) => c.startsWith('session=') || c.startsWith('3x-ui='));

	if (!sessionCookie) {
		throw new Error('Session cookie یافت نشد');
	}

	return sessionCookie.split(';')[0];
}
