import { preset as vuetifyPreset } from '../src/plugins/vuetify';
import { withVuetify, withThemeProvider } from '@socheatsok78/storybook-addon-vuetify/dist/decorators';

export const globalTypes = vuetifyPreset;

export const decorators = [withThemeProvider, withVuetify];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
