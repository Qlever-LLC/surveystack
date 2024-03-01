import 'vuetify/styles'; // Global CSS has to be imported
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const light = {
  dark: false,
  colors: {
    primary: '#006CD0', //as defined in brand guide
    secondary: '#014D4E',
    accent: '#1F803E', //as defined in brand guide
    error: '#D3400B', //as defined in brand guide
    warning: '#F1B711', //as defined in brand guide
    info: '#82AF9C',
    success: '#8bc34a',
    background: '#d9d9d9',
    heading: '#212121',
    focus: '#0E87CC',
  },
};

const dark = {
  dark: true,
  colors: {
    primary: '#006CD0', //as defined in brand guide
    secondary: '#014D4E',
    accent: '#1F803E', //as defined in brand guide
    error: '#D3400B', //as defined in brand guide
    warning: '#F1B711', //as defined in brand guide
    info: '#82AF9C',
    success: '#8bc34a',
    appbar: '#212121', // Dark background for appbar
    background: '#1c1c1c', // Dark background color
    heading: '#f5f5f5', // Light color for headings
    focus: '#0E87CC',
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light,
      dark,
    },
  },
});

export default vuetify;
