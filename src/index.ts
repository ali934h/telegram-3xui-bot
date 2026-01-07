import { handleTelegramUpdate, registerWebhook } from './telegram/bot';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/registerWebhook') {
			return registerWebhook(env);
		}

		if (request.method === 'POST' && url.pathname === '/webhook') {
			try {
				const update = await request.json();
				return handleTelegramUpdate(update, env);
			} catch (error) {
				console.error('Error handling update:', error);
				return new Response('Error', { status: 500 });
			}
		}

		return new Response('Telegram 3x-ui Bot is running!', { status: 200 });
	},
} satisfies ExportedHandler<Env>;
