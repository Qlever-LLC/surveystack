import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import { vuetify } from './plugins/vuetify';
import { startToggle } from './plugins/toggle';
import { startSentry } from './plugins/sentry';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import './css/transitions.css';

import api from './services/api.service';

// Auto include components for questions types
import addQuestionTypesComponents from '@/components/survey/question_types/index.js';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlError from '@/components/survey/drafts/ControlError.vue';

const app = createApp(App);
app.use(router);
app.use(store);
app.use(vuetify);

startToggle(store);

startSentry(app, store, router);

addQuestionTypesComponents(app);
app.component('app-control-label', appControlLabel);
app.component('app-control-hint', appControlHint);
app.component('app-control-more-info', appControlMoreInfo);
app.component('app-control-error', appControlError);

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
  // Register component globally
  app.component(
    componentName,
    // Look for the component options on `.default`, which will
    // exist if the component was exported with `export default`,
    // otherwise fall back to module's root.
    componentConfig.default || componentConfig
  );
});

api.init(process.env.VUE_APP_API_URL);

// remove initial loading screen (added in the index.html)
try {
  window.loading_screen.finish();
} catch (e) {
  console.error('Failed to remove loading screen', e);
}

app.mount('#app');
