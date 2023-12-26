import { config as vueconfig } from '@vue/test-utils';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';

const vuetify = createVuetify({
  components,
  directives,
});

vueconfig.global.plugins.push(vuetify);
vueconfig.global.renderStubDefaultSlot = true;

window.scrollTo = () => {};

// until this gets closed https://github.com/jsdom/jsdom/issues/1721
global.URL.createObjectURL = () => {};
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: () => {},
  },
});

//until this gets closed https://github.com/inrupt/solid-client-authn-js/issues/1676
//TODO issue above is closed now, test if it works
//global.TextEncoder = TextEncoder;
//global.TextDecoder = TextDecoder;
