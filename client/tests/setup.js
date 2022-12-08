import Vue from 'vue';
import Vuetify from 'vuetify';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

Vue.use(Vuetify);

window.scrollTo = () => {};

// until this gets closed https://github.com/jsdom/jsdom/issues/1721
global.URL.createObjectURL = () => {};
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: () => {},
  },
});

//until this gets closed https://github.com/inrupt/solid-client-authn-js/issues/1676
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
