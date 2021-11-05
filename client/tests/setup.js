import Vue from 'vue';
import Vuetify from 'vuetify';
import '@testing-library/jest-dom';

Vue.use(Vuetify);

window.scrollTo = () => {};

// until this gets closed https://github.com/jsdom/jsdom/issues/1721
global.URL.createObjectURL = jest.fn();
