import { sendMessage } from '../bot';
import { getPanelConfig } from '../../storage/kv';
import { getMainMenuKeyboard } from '../keyboards';
import { handleSetupFlow } from './setup';

export async function handleStartCommand(env: Env, chatId: number, userId: number): Promise<void> {
	const panelConfig = await getPanelConfig(env, userId);

	if (!panelConfig) {
		await sendMessage(
			env,
			chatId,
			'👋 به ربات مدیریت پنل 3x-ui خوش آمدید!\n\n' +
				'لطفا ابتدا اطلاعات پنل خود را تنظیم کنید.\n\n' +
				'آدرس پنل خود را وارد کنید (مثال: https://panel.example.com):'
		);
		await handleSetupFlow(env, chatId, userId, 'start');
		return;
	}

	await sendMessage(
		env,
		chatId,
		`خوش آمدید! 🎉\n\nپنل شما: <code>${panelConfig.url}</code>\n\nاز منوی زیر استفاده کنید:`,
		getMainMenuKeyboard()
	);
}
