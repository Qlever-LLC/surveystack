import { Client } from '@elastic/elasticsearch';

let client;
let isAuthenticationValid = true;

if (process.env.ELASTIC_ENABLE_LOGGING) {
	try {
		client = new Client({
			cloud: {
				id: process.env.ELASTIC_CLOUD_ID,
			},
			auth: {
				username: process.env.ELASTIC_AUTH_USERNAME,
				password: process.env.ELASTIC_AUTH_PASSWORD,
			},
		});
	} catch (error) {
		if (error?.code === 'ERR_INVALID_URL') {
			console.error('Error: ELASTIC_CLOUD_ID is not valid.');
		} else {
			console.error('Unexpected Error initializing Elasticsearch client:', error);
		}
	}
}

function log(message) {
	if (process.env.ELASTIC_ENABLE_LOGGING && client && isAuthenticationValid) {
		client
			.index({
				index: process.env.ELASTIC_INDEX_NAME,
				body: message,
			})
			.catch((error) => {
				if (error?.meta?.statusCode === 401) {
					console.error('Error: ELASTIC_AUTH_USERNAME and/or ELASTIC_AUTH_PASSWORD are not valid.');
					isAuthenticationValid = false;
				} else {
					console.error('Unexpected Error attempting to log to Elasticsearch:', error);
				}
			});
	}
}

export { log };
