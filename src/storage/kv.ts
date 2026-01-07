interface PanelConfig {
	url: string;
	username: string;
	password: string;
	session: string;
}

interface ConversationState {
	step: string;
	data?: any;
}

export async function getPanelConfig(env: Env, userId: number): Promise<PanelConfig | null> {
	const key = `panel_config:${userId}`;
	const data = await env.PANEL_DATA.get(key);
	return data ? JSON.parse(data) : null;
}

export async function setPanelConfig(
	env: Env,
	userId: number,
	config: PanelConfig
): Promise<void> {
	const key = `panel_config:${userId}`;
	await env.PANEL_DATA.put(key, JSON.stringify(config));
}

export async function getConversationState(
	env: Env,
	userId: number
): Promise<ConversationState | null> {
	const key = `conversation_state:${userId}`;
	const data = await env.PANEL_DATA.get(key);
	return data ? JSON.parse(data) : null;
}

export async function setConversationState(
	env: Env,
	userId: number,
	state: ConversationState | null
): Promise<ConversationState> {
	const key = `conversation_state:${userId}`;

	if (state === null) {
		await env.PANEL_DATA.delete(key);
		return { step: '', data: {} };
	}

	const currentState = await getConversationState(env, userId);
	const newState = {
		step: state.step,
		data: { ...currentState?.data, ...state.data },
	};

	await env.PANEL_DATA.put(key, JSON.stringify(newState));
	return newState;
}
