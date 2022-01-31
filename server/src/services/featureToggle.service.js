import { createApp } from '@unleash/proxy';
import Client from '@unleash/proxy/dist/client';
import { createProxyConfig } from '@unleash/proxy/dist/config';

const config = {
  unleashUrl: 'https://gitlab.com/api/v4/feature_flags/unleash/28776001',
  unleashApiToken: '_',
  unleashInstanceId: '1TA4jjg4dxs35BdXMYRs',
  clientKeys: ['proxy-secret', 'another-proxy-secret', 's1'],
  refreshInterval: 1000,
  // logLevel: 'info',
  // projectName: 'order-team',
  environment: 'development',
};

const client = new Client(createProxyConfig(config));

// Resolves when the client loaded the initial toggle states
const waitReadyPromise = new Promise((resolve) => {
  client.on('ready', () => resolve());
});

// This should be added to the express app, so the client can query this endpoint instead of the external service.
export const unleashProxyApp = createApp(config, client);

/**
 * Makes sure that the toggles are loaded and reads the state of the requested feature
 * @param {string} toggleName
 * @returns {Promise<boolean>} state of a feature toggle
 */
export const isToggleOn = async (toggleName) => {
  await waitReadyPromise;
  return client.getEnabledToggles().some((toggle) => toggle.name === toggleName && toggle.enabled);
};
