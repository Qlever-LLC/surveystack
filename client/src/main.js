import Vue from 'vue';
import CompositionApi from '@vue/composition-api';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import { startToggle } from './plugins/toggle';
import { startSentry } from './plugins/sentry';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import './css/transitions.css';

import api from './services/api.service';

// Auto include components for questions types
import '@/components/survey/question_types';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlError from '@/components/survey/drafts/ControlError.vue';

startToggle(store);

startSentry(Vue, store, router);

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

// remove initial loading screen (added in the index.html)
try {
  window.loading_screen.finish();
} catch (e) {
  console.error('Failed to remove loading screen', e);
}

const requireComponent = require.context(
  // The relative path of the components folder
  './components/ui/elements',
  true,
  // The regular expression used to match base component filenames
  /[A]\w+\.vue$/
);
requireComponent.keys().forEach((fileName) => {
  // Get component config
  const componentConfig = requireComponent(fileName);
  // PascalCase name of component is used
  const componentName = fileName
    .split('/')
    .pop()
    .replace(/\.\w+$/, '');
  console.log('import', fileName, componentName);
  // Register component globally
  Vue.component(
    componentName,
    // Look for the component options on `.default`, which will
    // exist if the component was exported with `export default`,
    // otherwise fall back to module's root.
    componentConfig.default || componentConfig
  );
});
