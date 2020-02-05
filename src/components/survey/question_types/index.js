// https://github.com/chrisvfritz/vue-enterprise-boilerplate/blob/master/src/components/_globals.js

// Globally register all type components within subfolders
import Vue from 'vue';

// https://webpack.js.org/guides/dependency-management/#require-context
const requireComponent = require.context(
  // Look for files in the current directory
  '.',
  // but not in subdirectories
  false,
  /\.vue$/,
);

// For each matching file name...
requireComponent.keys().forEach((fileName) => {
  // Get the component config
  const componentConfig = requireComponent(fileName);
  // Get the PascalCase version of the component name
  const componentName = `AppControl${
    fileName
    // Remove the "./_" from the beginning
      .replace(/^\.\//, '')
    // Remove the file extension from the end
      .replace(/\.\w+$/, '')}`;

  // Globally register the component
  Vue.component(componentName, componentConfig.default || componentConfig);
});
