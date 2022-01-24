import Vue from 'vue';
import CompositionApi from '@vue/composition-api';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import { startToggle } from './plugins/toggle';
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

startToggle(store);

// TODO minimize recomputes
store.watch(
  (_, getters) => {
    const user = getters['auth/user'];
    const groups = store.getters['memberships/groups'];
    const activeGroupId = store.getters['memberships/activeGroup'];
    const group = groups.find((item) => item._id === activeGroupId);
    return [user, group];
  },
  ([user, group]) => {
    console.log({ group, user });
    Sentry.setUser({
      id: user._id,
      email: user.email,
      username: user.name,
    });
    Sentry.setContext('group', {
      id: group._id,
      name: group.name,
    });
  },
  { immediate: true }
);

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
