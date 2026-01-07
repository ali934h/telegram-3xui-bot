import { sendMessage, editMessage } from '../bot';
import { getPanelConfig, setConversationState, getConversationState } from '../../storage/kv';
import { PanelAPI } from '../../panel/api';
import { generateUUID, generateClientConfig } from '../../utils/client-generator';
import { getMainMenuKeyboard } from '../keyboards';

type ClientStep = 'start' | 'client_awaiting_email';

export async function handleAddClientFlow(
	env: Env,
	chatId: number,
	userId: number,
	step: ClientStep | string,
	userInput?: string
): Promise<void> {
	const panelConfig = await getPanelConfig(env, userId);

	if (!panelConfig) {
		await sendMessage(
			env,
			chatId,
			'❌ ابتدا باید پنل خود را تنظیم کنید.\nاز دستور /setup استفاده کنید.'
		);
		return;
	}

	const api = new PanelAPI(panelConfig.url, panelConfig.session);

	switch (step) {
		case 'start':
			try {
				await sendMessage(env, chatId, '⏳ در حال دریافت لیست inbound ها...');

				const inboundsData = await api.getInbounds();

				if (!inboundsData.success || !inboundsData.obj || inboundsData.obj.length === 0) {
					await sendMessage(env, chatId, '❌ هیچ inbound فعالی یافت نشد.');
					return;
				}

				const inbounds = inboundsData.obj;
				const keyboard = {
					inline_keyboard: inbounds.map((inbound: any) => [
						{
							text: `${inbound.remark} (${inbound.protocol})`,
							callback_data: `inbound_${inbound.id}`,
						},
					]),
				};

				await sendMessage(
					env,
					chatId,
					'📋 لیست Inbound های شما:\n\nلطفا یک inbound را برای افزودن کلاینت انتخاب کنید:',
					keyboard
				);
			} catch (error: any) {
				await sendMessage(
					env,
					chatId,
					`❌ خطا در دریافت لیست inbound ها:\n${error.message}\n\nممکن است session منقضی شده باشد. از /setup استفاده کنید.`
				);
			}
			break;

		case 'client_awaiting_email':
			if (!userInput) return;

			const state = await getConversationState(env, userId);
			if (!state || !state.data || !state.data.inboundId) {
				await sendMessage(env, chatId, '❌ خطا در پردازش. لطفا دوباره تلاش کنید.');
				return;
			}

			const email = userInput.trim();
			const inboundId = state.data.inboundId;
			const protocol = state.data.protocol;

			await sendMessage(env, chatId, '⏳ در حال ایجاد کلاینت...');

			try {
				const uuid = generateUUID();
				const clientData = {
					id: uuid,
					email: email,
					limitIp: 0,
					totalGB: 0,
					expiryTime: 0,
					enable: true,
					tgId: '',
					subId: '',
				};

				const result = await api.addClient(inboundId, clientData);

				if (!result.success) {
					throw new Error(result.msg || 'خطا در افزودن کلاینت');
				}

				const config = generateClientConfig({
					protocol,
					uuid,
					email,
					panelUrl: panelConfig.url,
					inboundId,
				});

				await setConversationState(env, userId, null);

				await sendMessage(
					env,
					chatId,
					`✅ کلاینت با موفقیت ایجاد شد!\n\n` +
						`📧 ایمیل: <code>${email}</code>\n` +
						`🆔 UUID: <code>${uuid}</code>\n` +
						`🔗 پروتکل: ${protocol.toUpperCase()}\n\n` +
						`📱 لینک Subscription:\n<code>${config.subscriptionUrl}</code>\n\n` +
						`⚙️ Config:\n<code>${config.configUrl}</code>`,
					getMainMenuKeyboard()
				);
			} catch (error: any) {
				await setConversationState(env, userId, null);
				await sendMessage(
					env,
					chatId,
					`❌ خطا در ایجاد کلاینت:\n${error.message}`,
					getMainMenuKeyboard()
				);
			}
			break;
	}
}

export async function handleInboundSelection(
	env: Env,
	chatId: number,
	userId: number,
	messageId: number,
	inboundId: number
): Promise<void> {
	const panelConfig = await getPanelConfig(env, userId);

	if (!panelConfig) {
		await editMessage(env, chatId, messageId, '❌ پنل تنظیم نشده است.');
		return;
	}

	try {
		const api = new PanelAPI(panelConfig.url, panelConfig.session);
		const inboundsData = await api.getInbounds();

		if (!inboundsData.success || !inboundsData.obj) {
			await editMessage(env, chatId, messageId, '❌ خطا در دریافت اطلاعات inbound');
			return;
		}

		const selectedInbound = inboundsData.obj.find((ib: any) => ib.id === inboundId);

		if (!selectedInbound) {
			await editMessage(env, chatId, messageId, '❌ Inbound یافت نشد');
			return;
		}

		await setConversationState(env, userId, {
			step: 'client_awaiting_email',
			data: {
				inboundId: inboundId,
				protocol: selectedInbound.protocol,
			},
		});

		await editMessage(
			env,
			chatId,
			messageId,
			`✅ Inbound انتخاب شد: ${selectedInbound.remark}\n\nحالا ایمیل کلاینت را وارد کنید:\n(مثال: user@example.com)`
		);
	} catch (error: any) {
		await editMessage(env, chatId, messageId, `❌ خطا: ${error.message}`);
	}
}
