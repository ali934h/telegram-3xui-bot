export class PanelAPI {
	private baseUrl: string;
	private session: string;

	constructor(baseUrl: string, session: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.session = session;
	}

	private async request(path: string, options: RequestInit = {}): Promise<any> {
		const url = `${this.baseUrl}${path}`;
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			Cookie: this.session,
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	async getInbounds(): Promise<any> {
		return this.request('/panel/api/inbounds/list', { method: 'GET' });
	}

	async addClient(inboundId: number, clientData: any): Promise<any> {
		return this.request(`/panel/api/inbounds/addClient`, {
			method: 'POST',
			body: JSON.stringify({
				id: inboundId,
				settings: JSON.stringify({
					clients: [clientData],
				}),
			}),
		});
	}
}
