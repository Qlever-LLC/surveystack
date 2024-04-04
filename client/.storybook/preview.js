export const parameters = {
  actions: { argTypesRegex: '^on.*' },
};

import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

import { vuetifyStorybook } from './vuetifyStorybook';
import { setup } from '@storybook/vue3';
import { withVuetify } from './withVuetifyTheme.decorator';

function importAComps(app) {
  const requireComponent = require.context(
    // The relative path of the components folder
    './../src/components/ui/elements',
    true,
    // The regular expression used to match base component filenames
    /[A]\w+\.vue$/
  );
  console.log(requireComponent);
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
}

function registerPlugins(app) {
  app.use(vuetifyStorybook);
}

setup((app) => {
  importAComps(app);
  registerPlugins(app);
});

export const decorators = [withVuetify];
