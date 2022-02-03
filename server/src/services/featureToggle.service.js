import { createApp } from '@unleash/proxy';
import Client from '@unleash/proxy/dist/client';
import { createProxyConfig } from '@unleash/proxy/dist/config';

// Disable service when env variables are not set (to prevent flooding the consol with errors in development)
const ENABLED = process.env.UNLEASH_URL && process.env.UNLEASH_INSTANCE_ID;

if (!ENABLED) {
  console.warn('ENV vars missing for the feature toggles. See featureToggles.md for details.');
}

const config = {
  unleashUrl: process.env.UNLEASH_URL,
  unleashApiToken: '_',
  unleashInstanceId: process.env.UNLEASH_INSTANCE_ID,
  clientKeys: ['proxy-secret'],
  refreshInterval: 1000,
  unleashAppName: process.env.UNLEASH_APP_NAME,
};

const client = ENABLED ? new Client(createProxyConfig(config)) : null;

// Resolves when the client loaded the initial toggle states
const waitReadyPromise = ENABLED
  ? new Promise((resolve) => {
      client.on('ready', () => resolve());
    })
  : null;

const noopMiddleware = (_, __, next) => next();
// This should be added to the express app, so the client can query this endpoint instead of the external service.
export const unleashProxyApp = ENABLED ? createApp(config, client) : noopMiddleware;

/**
 * Makes sure that the toggles are loaded and reads the state of the requested feature
 * @param {string} toggleName
 * @param {string} userId Optonal. Only needed for toggles with per-user enable strategies
 * @returns {Promise<boolean>} state of a feature toggle
 */
export const isToggleOn = async (toggleName, userId) => {
  if (!ENABLED) {
    return false;
  }
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
  const email = String(res.locals.auth.user?.email).toLowerCase();
  res.locals.isToggleOn = (featureName) => isToggleOn(featureName, email);
  next();
};
