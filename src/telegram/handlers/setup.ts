import { sendMessage } from '../bot';
import { setConversationState, setPanelConfig, getPanelConfig } from '../../storage/kv';
import { validatePanelUrl } from '../../utils/validator';
import { loginToPanel } from '../../panel/auth';
import { getMainMenuKeyboard } from '../keyboards';

type SetupStep = 'start' | 'awaiting_url' | 'awaiting_username' | 'awaiting_password';

export async function handleSetupFlow(
	env: Env,
	chatId: number,
	userId: number,
	step: SetupStep | string,
	userInput?: string
): Promise<void> {
	switch (step) {
		case 'start':
			await setConversationState(env, userId, { step: 'awaiting_url' });
			await sendMessage(
				env,
				chatId,
				'⚙️ راه‌اندازی پنل\n\nآدرس پنل خود را وارد کنید:\n(مثال: https://panel.example.com)'
			);
			break;

		case 'awaiting_url':
			if (!userInput) return;

			const urlValidation = validatePanelUrl(userInput);
			if (!urlValidation.valid) {
				await sendMessage(env, chatId, `❌ ${urlValidation.error}\n\nلطفا دوباره تلاش کنید:`);
				return;
			}

			await setConversationState(env, userId, {
				step: 'awaiting_username',
				data: { url: userInput },
			});
			await sendMessage(env, chatId, '✅ آدرس پنل ذخیره شد.\n\nنام کاربری پنل را وارد کنید:');
			break;

		case 'awaiting_username':
			if (!userInput) return;

			const state = await setConversationState(env, userId, {
				step: 'awaiting_password',
				data: { username: userInput },
			});
			await sendMessage(env, chatId, '✅ نام کاربری ذخیره شد.\n\nرمز عبور پنل را وارد کنید:');
			break;

		case 'awaiting_password':
			if (!userInput) return;

			const currentState = await setConversationState(env, userId, {
				step: 'awaiting_password',
				data: { password: userInput },
			});

			await sendMessage(env, chatId, '⏳ در حال اتصال به پنل...');

			const { url, username, password } = currentState.data;

			try {
				const session = await loginToPanel(url, username, password);

				await setPanelConfig(env, userId, {
					url,
					username,
					password,
					session,
				});

				await setConversationState(env, userId, null);

				await sendMessage(
					env,
					chatId,
					'✅ اتصال با موفقیت برقرار شد!\n\nاز منوی زیر استفاده کنید:',
					getMainMenuKeyboard()
				);
			} catch (error: any) {
				await setConversationState(env, userId, null);
				await sendMessage(
					env,
					chatId,
					`❌ خطا در اتصال به پنل:\n${error.message}\n\nبرای تلاش مجدد از دستور /setup استفاده کنید.`
				);
			}
			break;
	}
}
