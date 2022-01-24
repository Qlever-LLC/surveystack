import Vue from 'vue';
import CompositionApi from '@vue/composition-api';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import './css/transitions.css';
import * as Sentry from '@sentry/vue';
import { Integrations } from '@sentry/tracing';

import api from './services/api.service';

// Auto include components for questions types
import '@/components/survey/question_types';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlError from '@/components/survey/drafts/ControlError.vue';

// TODO delete me!
console.log('process.env.VUE_APP_VERSION', process.env.VUE_APP_VERSION);
console.log('process.env.VUE_APP_COMMIT_SHORT_SHA', process.env.VUE_APP_COMMIT_SHORT_SHA);
console.log('process.env.VUE_APP_API_URL', process.env.VUE_APP_API_URL);
console.log('process.env.VUE_APP_SENTRY_DSN', process.env.VUE_APP_SENTRY_DSN);
console.log('process.env.VUE_APP_ENVIRONMENT', process.env.VUE_APP_ENVIRONMENT);

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

Vue.component('app-control-label', appControlLabel);
Vue.component('app-control-hint', appControlHint);
Vue.component('app-control-more-info', appControlMoreInfo);
Vue.component('app-control-error', appControlError);

api.init(process.env.VUE_APP_API_URL);

Vue.filter('capitalize', (value) => {
  if (!value) return '';
  const v = value.toString();
  return v.charAt(0).toUpperCase() + v.slice(1);
});

Vue.filter('showNull', (value) => {
  if (value === null) return 'null';
  if (!value) return '';
  return value;
});

Vue.config.productionTip = false;

Vue.use(CompositionApi);

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
