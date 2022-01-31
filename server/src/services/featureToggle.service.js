import { createApp } from '@unleash/proxy';
import Client from '@unleash/proxy/dist/client';
import { createProxyConfig } from '@unleash/proxy/dist/config';

// TODO handle when env variables not set

const config = {
  unleashUrl: process.env.UNLEASH_URL,
  unleashApiToken: '_',
  unleashInstanceId: process.env.UNLEASH_INSTANCE_ID,
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
 * @param {string} userId Optonal. Only needed for toggles with per-user enable strategies
 * @returns {Promise<boolean>} state of a feature toggle
 */
export const isToggleOn = async (toggleName, userId) => {
  await waitReadyPromise;
  const context = { userId };
  return client
    .getEnabledToggles(context)
    .some((toggle) => toggle.name === toggleName && toggle.enabled);
};

/**
 * Add res.locals.isToggleOn(toggleName): Promise<boolean>
 * Same as isToggleOn(toggleName, userId) but the userId will be filled from res.locals.auth.user._id
 */
export const toggleMiddleware = (req, res, next) => {
  const userId = res.locals.auth.user?._id.toString();
  res.locals.isToggleOn = (featureName) => isToggleOn(featureName, userId);
  next();
};
