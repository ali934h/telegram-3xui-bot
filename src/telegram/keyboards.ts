export function getMainMenuKeyboard() {
	return {
		keyboard: [
			['➕ افزودن کلاینت'],
			['➕➕ افزودن دسته‌جمعی'],
			['⚙️ تنظیمات پنل'],
		],
		resize_keyboard: true,
		persistent: true,
	};
}

export function getSettingsKeyboard() {
	return {
		keyboard: [['🔄 تغییر پنل'], ['🏠 بازگشت به منو']],
		resize_keyboard: true,
	};
}
