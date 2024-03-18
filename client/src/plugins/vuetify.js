import 'vuetify/styles'; // Global CSS has to be imported
import { createVuetify } from 'vuetify';

const light = {
  dark: false,
  colors: {
    primary: '#0E87CC',
    secondary: '#014D4E',
    accent: '#1FA774',
    error: '#f44336',
    warning: '#ffc107',
    info: '#82AF9C',
    success: '#8bc34a',
    appbar: '#f5f5f5',
    background: '#d9d9d9',
    heading: '#212121',
    focus: '#0E87CC',
  },
};

const dark = {
  dark: true,
  colors: {
    primary: '#0E87CC',
    secondary: '#014D4E',
    accent: '#1FA774',
    error: '#f44336',
    warning: '#ffc107',
    info: '#82AF9C',
    success: '#8bc34a',
    appbar: '#212121', // Dark background for appbar
    background: '#1c1c1c', // Dark background color
    heading: '#f5f5f5', // Light color for headings
    focus: '#0E87CC',
  },
};

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light,
      dark,
    },
  },
});

export default vuetify;
