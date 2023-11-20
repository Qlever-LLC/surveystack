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
import AChip from '../src/components/ui/elements/AChip.vue';
import ASheet from '../src/components/ui/elements/ASheet.vue';
import ARadio from '../src/components/ui/elements/ARadio.vue';
import ARadioGroup from '../src/components/ui/elements/ARadioGroup.vue';

const localVue = createLocalVue();
localVue.component('a-chip', AChip);
localVue.component('a-sheet', ASheet);
localVue.component('a-radio', ARadio);
localVue.component('a-radio-group', ARadioGroup);

export { renderWithVuetify, localVue };
