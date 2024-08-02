import 'vuetify/styles'; // Global CSS has to be imported
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const vuetifyStorybook = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {},
    variations: {
      colors: ['accent'],
      lighten: 8, //add two lighten variants
      darken: 8, //add two darken variants
    },
  },
});

export { vuetifyStorybook };
