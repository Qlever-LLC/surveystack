import * as Sentry from '@sentry/vue';
import { BrowserTracing } from '@sentry/browser';
import { CaptureConsole } from '@sentry/integrations';

// NOTE: you can send traces from your localhost by adding these variables to client/.env.local
//  VUE_APP_SENTRY_DSN="Copy the DNS from https://sentry.io/settings/our-sci/projects/survey-stack/keys/"
//  VUE_APP_SENTRY_ENV="YOURNAME-development"

// Start error tracking and performance monitoring with Sentry.io
export const startSentry = (app, store, router) => {
  // TODO remove feature flag after we verified it's stable
  // Wait until toggle states are loaded
  if (!store.getters['toggle/isLoaded']) {
    const stopWatch = store.watch(
      (_, getters) => getters['toggle/isLoaded'],
      (togglesLoaded) => {
        if (togglesLoaded) {
          stopWatch();
          startSentry(app, store, router);
        }
      },
      { immediate: true }
    );
    return;
  }
  // Bail if the feature toggle is not enabled
  if (!store.getters['toggle/isOn']['feature_sentry_tracing']) {
    return;
  }

  // Parameters

  // User for filtering traces
  const environment = process.env.VUE_APP_SENTRY_ENV || process.env.NODE_ENV || 'development';
  // Enables differentiating between different versions of the app
  // The env variable is set on GitLab CI (see gitlab-ci.yaml)
  const release = process.env.VUE_APP_COMMIT_SHA || 'unknown';
  // Sets the chance that a log will be sent to Sentry.io
  // Useful to lower the amount of logs sent in production
  // Set in the GitLab CI variables: https://gitlab.com/our-sci/software/surveystack/-/settings/ci_cd
  const tracesSampleRate = Number.parseFloat(process.env.VUE_APP_SENTRY_TRACES_SAMPLE_RATE) || 1.0;
  // Sentry.io sink endpoint.
  // Set in the GitLab CI variables: https://gitlab.com/our-sci/software/surveystack/-/settings/ci_cd
  const dsn = process.env.VUE_APP_SENTRY_DSN;

  if (!dsn) {
    console.warn('VUE_APP_SENTRY_DSN is not set. Skip tracing to Sentry.io');
    return;
  }

  Sentry.init({
    app,
    environment,
    release,
    dsn,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracePropagationTargets: [process.env.VUE_APP_API_URL, /^\//],
      }),
      new CaptureConsole({
        levels: ['error'],
      }),
    ],
    debug: false,
    tracesSampleRate,
    tracingOptions: {
      trackComponents: true,
    },
    // Vue specific
    logErrors: process.env.NODE_ENV === 'production' ? false : true,
    attachProps: true,
    attachStacktrace: true,
  });

  // Keep the sentry user in sync with the store
  store.watch(
    (_, getters) => getters['auth/user'],
    ({ _id: id, name: username, email } = {}) => {
      // include user info in the traces
      Sentry.setUser({ id, email, username });
    },
    { immediate: true }
  );

  // Keep the sentry group context in sync with the store
  store.watch(
    (_, getters) => {
      const groups = getters['memberships/groups'];
      const activeGroupId = getters['memberships/activeGroup'];
      return groups.find((item) => item._id === activeGroupId);
    },
    ({ id, name } = {}) => {
      // include group info in the traces
      Sentry.setContext('group', { id, name });
    },
    { immediate: true }
  );
};
