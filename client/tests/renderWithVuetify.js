import { render } from '@testing-library/vue';
import Vuetify from 'vuetify';

const renderWithVuetify = function (component, options, callback) {
  const root = document.createElement('div');
  root.setAttribute('data-app', 'true');

  return render(
    component,
    {
      container: document.body.appendChild(root),
      // for Vuetify components that use the $vuetify instance property
      vuetify: new Vuetify(),
      ...options,
    },
    callback
  );
};

import { createLocalVue } from '@vue/test-utils';
// import AComp from '../src/components/ui/elements/AComp.vue';

const localVue = createLocalVue();
// localVue.component('a-comp', AComp);

export { renderWithVuetify, localVue };
