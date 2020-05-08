import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    light: true,
    themes: {
      light: {
        primary: '#f44336',
        secondary: '#82AF9C',
        accent: '#FF5722',
        error: '#f44336',
        warning: '#ffc107',
        info: '#82AF9C',
        success: '#8bc34a',
      },
    },
  },
});
