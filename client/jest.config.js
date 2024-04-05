const esModules = ['ol', '@farmos.org', '@our-sci/farmos-map', 'splitpanes'].join('|');

module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  setupFiles: ['jest-canvas-mock', 'fake-indexeddb/auto'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true,
  resetModules: true,
  moduleNameMapper: {
    '^!!raw-loader!.*': 'jest-raw-loader',
    'vuetify/styles': '<rootDir>/tests/styleMock.js',
    '^vuetify$': 'vuetify/dist/vuetify.js',
  },
  silent: true,
};
