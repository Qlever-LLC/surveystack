import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

import api from './services/api.service';

api.init(process.env.VUE_APP_API_URL);

Vue.filter('capitalize', (value) => {
  if (!value) return '';
  const v = value.toString();
  return v.charAt(0).toUpperCase() + v.slice(1);
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App),
}).$mount('#app');
