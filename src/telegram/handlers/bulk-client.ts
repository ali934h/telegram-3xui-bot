import { sendMessage, editMessage, getFile } from '../bot';
import { getPanelConfig, setConversationState, getConversationState } from '../../storage/kv';
import { PanelAPI } from '../../panel/api';
import { parseClientList, validateUUID } from '../../utils/validator';
import { getMainMenuKeyboard } from '../keyboards';

type BulkStep = 'start' | 'bulk_awaiting_list';

export async function handleBulkClientFlow(
	env: Env,
	chatId: number,
	userId: number,
	step: BulkStep | string,
	userInput?: string,
	document?: any
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
							callback_data: `bulk_inbound_${inbound.id}`,
						},
					]),
				};

				await sendMessage(
					env,
					chatId,
					'📋 لیست Inbound های شما:\n\nلطفا یک inbound را برای افزودن دسته‌جمعی کلاینت‌ها انتخاب کنید:',
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

		case 'bulk_awaiting_list':
			const state = await getConversationState(env, userId);
			if (!state || !state.data || !state.data.inboundId) {
				await sendMessage(env, chatId, '❌ خطا در پردازش. لطفا دوباره تلاش کنید.');
				return;
			}

			let clientListText = '';

			if (document) {
				try {
					await sendMessage(env, chatId, '📄 در حال دریافت فایل...');
					clientListText = await getFile(env, document.file_id);
				} catch (error: any) {
					await sendMessage(env, chatId, `❌ خطا در خواندن فایل:\n${error.message}`);
					return;
				}
			} else if (userInput) {
				clientListText = userInput;
			} else {
				return;
			}

			const clients = parseClientList(clientListText);

			if (clients.length === 0) {
				await sendMessage(
					env,
					chatId,
					'❌ هیچ کلاینت معتبری یافت نشد.\n\nفرمت صحیح:\nUUID email\nمثال:\nf3ab7b0c-a63b-442e-89f1-00759638f75d ali'
				);
				return;
			}

			const inboundId = state.data.inboundId;
			await sendMessage(
				env,
				chatId,
				`📊 پیدا شد: ${clients.length} کلاینت\n\n⏳ در حال افزودن...`
			);

			const results: { success: number; failed: number; errors: string[] } = {
				success: 0,
				failed: 0,
				errors: [],
			};

			for (let i = 0; i < clients.length; i++) {
				const client = clients[i];

				if ((i + 1) % 5 === 0 || i === clients.length - 1) {
					await sendMessage(
						env,
						chatId,
						`⏳ پیشرفت: ${i + 1}/${clients.length}`
					);
				}

				try {
					const clientData = {
						id: client.uuid,
						email: client.email,
						limitIp: 0,
						totalGB: 0,
						expiryTime: 0,
						enable: true,
						tgId: '',
						subId: '',
					};

					const result = await api.addClient(inboundId, clientData);

					if (result.success) {
						results.success++;
					} else {
						results.failed++;
						results.errors.push(`${client.email}: ${result.msg || 'خطای نامشخص'}`);
					}
				} catch (error: any) {
					results.failed++;
					results.errors.push(`${client.email}: ${error.message}`);
				}
			}

			await setConversationState(env, userId, null);

			let reportMessage = `✅ افزودن دسته‌جمعی تکمیل شد!\n\n`;
			reportMessage += `📊 گزارش:\n`;
			reportMessage += `✅ موفق: ${results.success}\n`;
			reportMessage += `❌ ناموفق: ${results.failed}\n`;

			if (results.errors.length > 0) {
				reportMessage += `\n❌ خطاها:\n`;
				const maxErrors = 10;
				for (let i = 0; i < Math.min(results.errors.length, maxErrors); i++) {
					reportMessage += `- ${results.errors[i]}\n`;
				}
				if (results.errors.length > maxErrors) {
					reportMessage += `... و ${results.errors.length - maxErrors} خطای دیگر`;
				}
			}

			await sendMessage(env, chatId, reportMessage, getMainMenuKeyboard());
			break;
	}
}

export async function handleBulkInboundSelection(
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
			step: 'bulk_awaiting_list',
			data: {
				inboundId: inboundId,
				protocol: selectedInbound.protocol,
			},
		});

		await editMessage(
			env,
			chatId,
			messageId,
			`✅ Inbound انتخاب شد: ${selectedInbound.remark}\n\n` +
				`حالا لیست کلاینت‌ها را بفرستید:\n\n` +
				`📄 فایل .txt یا پیام متنی\n\n` +
				`فرمت:\nUUID email\n\n` +
				`مثال:\nf3ab7b0c-a63b-442e-89f1-00759638f75d ali\n88b552cc-b1e5-4da9-878c-e718d5594cbe negin`
		);
	} catch (error: any) {
		await editMessage(env, chatId, messageId, `❌ خطا: ${error.message}`);
	}
}
