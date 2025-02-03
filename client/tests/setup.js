/* eslint-disable no-undef */
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { clearAllSubmissions, clearAllResources } from '../src/store/db';

window.scrollTo = () => {};

global.ResizeObserver = require('resize-observer-polyfill');

// until this gets closed https://github.com/jsdom/jsdom/issues/1721
global.URL.createObjectURL = () => {};
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: () => {},
  },
});

global.structuredClone = structuredClone;

//until this gets closed https://github.com/inrupt/solid-client-authn-js/issues/1676
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// https://github.com/jsdom/jsdom/issues/3522
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

afterEach(async () => {
  await Promise.all([clearAllSubmissions(), clearAllResources()]);
});
