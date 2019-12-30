import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: '#679F38',
        secondary: '#82AF9C',
        accent: '#99AC3D',
        error: '#f44336',
        warning: '#ffc107',
        info: '#82AF9C',
        success: '#8bc34a',
      },
    },
  },
});
