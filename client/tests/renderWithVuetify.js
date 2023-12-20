import { render } from '@testing-library/vue';
import vuetify from '@/plugins/vuetify';
import { createStoreObject } from '@/store';
import router from '@/router';

const store = createStoreObject();

const renderWithVuetify = function (component, options, callback) {
  const root = document.createElement('div');
  root.setAttribute('data-app', 'true');

  return render(
    component,
    {
      container: document.body.appendChild(root),
      // for Vuetify components that use the $vuetify instance property
      global: {
        plugins: [store, router, vuetify],
      },
      ...options,
    },
    callback //TODO refactor, see https://github.com/testing-library/vue-testing-library/releases?page=4
  );
};

export { renderWithVuetify };
