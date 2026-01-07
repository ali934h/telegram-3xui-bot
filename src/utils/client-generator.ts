export function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function generateClientConfig(params: {
	protocol: string;
	uuid: string;
	email: string;
	panelUrl: string;
	inboundId: number;
}): { subscriptionUrl: string; configUrl: string } {
	const { protocol, uuid, email, panelUrl, inboundId } = params;

	const baseUrl = panelUrl.replace(/\/$/, '');
	const url = new URL(baseUrl);
	const domain = url.hostname;
	const port = url.port || (url.protocol === 'https:' ? '443' : '80');

	let configUrl = '';

	switch (protocol.toLowerCase()) {
		case 'vless':
			configUrl = `vless://${uuid}@${domain}:${port}?security=tls&type=tcp&headerType=none#${encodeURIComponent(email)}`;
			break;
		case 'vmess':
			const vmessConfig = {
				v: '2',
				ps: email,
				add: domain,
				port: port,
				id: uuid,
				aid: '0',
				net: 'tcp',
				type: 'none',
				host: '',
				path: '',
				tls: 'tls',
			};
			configUrl = 'vmess://' + btoa(JSON.stringify(vmessConfig));
			break;
		case 'trojan':
			configUrl = `trojan://${uuid}@${domain}:${port}?security=tls&type=tcp#${encodeURIComponent(email)}`;
			break;
		default:
			configUrl = `${protocol}://${uuid}@${domain}:${port}#${encodeURIComponent(email)}`;
	}

	const subscriptionUrl = `${baseUrl}/sub/${uuid}`;

	return {
		subscriptionUrl,
		configUrl,
	};
}
