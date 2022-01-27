import * as Sentry from '@sentry/vue';
import { Integrations } from '@sentry/tracing';

// TODO delete me!
console.log('process.env.VUE_APP_VERSION', process.env.VUE_APP_VERSION);
console.log('process.env.VUE_APP_COMMIT_SHORT_SHA', process.env.VUE_APP_COMMIT_SHORT_SHA);
console.log('process.env.VUE_APP_API_URL', process.env.VUE_APP_API_URL);
console.log('process.env.VUE_APP_SENTRY_DSN', process.env.VUE_APP_SENTRY_DSN);
console.log('process.env.VUE_APP_ENVIRONMENT', process.env.VUE_APP_ENVIRONMENT);

export const startSentry = (Vue, store, router) => {
  Sentry.init({
    Vue,
    environment: process.env.VUE_APP_ENVIRONMENT,
    release: `survey-stack-client@${process.env.VUE_APP_VERSION}/${process.env.VUE_APP_COMMIT_SHORT_SHA || 'unknown'}`,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: [process.env.VUE_APP_API_URL, /^\//],
      }),
    ],
    debug: false,
    tracesSampleRate: Number.parseFloat(process.env.VUE_APP_SENTRY_TRACES_SAMPLE_RATE) || 1.0,
    tracingOptions: {
      trackComponents: true,
    },
    // Vue specific
    logErrors: process.env.VUE_APP_ENVIRONMENT === 'production' ? false : true,
    attachProps: true,
    attachStacktrace: true,
  });

  // Keep the sentry user in sync with the store
  store.watch(
    (_, getters) => getters['auth/user'],
    ({ _id: id, name: username, email } = {}) => {
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
      Sentry.setContext('group', { id, name });
    },
    { immediate: true }
  );
};
