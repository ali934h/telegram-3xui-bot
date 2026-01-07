import { handleStartCommand } from './handlers/start';
import { handleSetupFlow } from './handlers/setup';
import { getConversationState } from '../storage/kv';

interface TelegramUpdate {
	message?: {
		message_id: number;
		from: { id: number; first_name: string };
		chat: { id: number };
		text?: string;
	};
	callback_query?: {
		id: string;
		from: { id: number };
		message: { chat: { id: number }; message_id: number };
		data: string;
	};
}

export async function handleTelegramUpdate(update: TelegramUpdate, env: Env): Promise<Response> {
	const message = update.message;
	const callbackQuery = update.callback_query;

	if (!env.TELEGRAM_BOT_TOKEN || !env.ALLOWED_USER_IDS) {
		console.error('Missing required secrets');
		return new Response('Configuration error', { status: 500 });
	}

	const allowedIds = env.ALLOWED_USER_IDS.split(',').map((id) => parseInt(id.trim()));

	if (message) {
		const userId = message.from.id;
		const chatId = message.chat.id;
		const text = message.text || '';

		if (!allowedIds.includes(userId)) {
			await sendMessage(env, chatId, '⛔️ شما اجازه استفاده از این ربات را ندارید.');
			return new Response('OK');
		}

		if (text.startsWith('/start')) {
			await handleStartCommand(env, chatId, userId);
			return new Response('OK');
		}

		if (text.startsWith('/setup')) {
			await handleSetupFlow(env, chatId, userId, 'start');
			return new Response('OK');
		}

		const state = await getConversationState(env, userId);
		if (state && state.step) {
			await handleSetupFlow(env, chatId, userId, state.step, text);
			return new Response('OK');
		}

		await sendMessage(env, chatId, 'لطفا از منو یا دستورات استفاده کنید.');
	}

	if (callbackQuery) {
		const userId = callbackQuery.from.id;
		const chatId = callbackQuery.message.chat.id;

		if (!allowedIds.includes(userId)) {
			return new Response('OK');
		}

		await answerCallbackQuery(env, callbackQuery.id);
	}

	return new Response('OK');
}

export async function sendMessage(
	env: Env,
	chatId: number,
	text: string,
	replyMarkup?: any
): Promise<void> {
	const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
	const body: any = {
		chat_id: chatId,
		text: text,
		parse_mode: 'HTML',
	};

	if (replyMarkup) {
		body.reply_markup = replyMarkup;
	}

	await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

export async function answerCallbackQuery(env: Env, callbackQueryId: string): Promise<void> {
	const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
	await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ callback_query_id: callbackQueryId }),
	});
}

export async function registerWebhook(env: Env): Promise<Response> {
	if (!env.TELEGRAM_BOT_TOKEN) {
		return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const webhookUrl = `https://telegram-3xui-bot.YOUR_SUBDOMAIN.workers.dev/webhook`;
	const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: webhookUrl }),
	});

	const result = await response.json();
	return new Response(JSON.stringify(result), {
		headers: { 'Content-Type': 'application/json' },
	});
}
