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
        primary: '#03A9F4',
        secondary: '#FF5555',
        accent: '#FF5722',
        error: '#f44336',
        warning: '#ffc107',
        info: '#82AF9C',
        success: '#8bc34a',
        // appbar: '#ffffff',
        appbar: '#FF5555',
      },
    },
  },
});
