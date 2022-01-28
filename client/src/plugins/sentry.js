import * as Sentry from '@sentry/vue';
import { Integrations } from '@sentry/tracing';

// NOTE: you can send traces from your localhost by adding these variables to client/.env.local
//  VUE_APP_SENTRY_DSN="Copy the DNS from https://sentry.io/settings/our-sci/projects/survey-stack/keys/"
//  VUE_APP_SENTRY_ENV="YOURNAME-development"

// Start error tracking and performance monitoring with Sentry.io
export const startSentry = (Vue, store, router) => {
  // Parameters

  // User for filtering traces
  const environment = process.env.VUE_APP_SENTRY_ENV || process.env.NODE_ENV || 'development';
  console.log({ environment }, process.env.VUE_APP_SENTRY_ENV, process.env.NODE_ENV);
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
    Vue,
    environment,
    release,
    dsn,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: [process.env.VUE_APP_API_URL, /^\//],
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
