const esModules = [
  'vuetify',
  'vuetify/components',
  'vuetify/directives',
  'ol',
  'monaco-editor',
  '@farmos.org',
  '@our-sci/farmos-map',
].join('|');

module.exports = {
  verbose: true,
  preset: '@vue/cli-plugin-unit-jest', //TODO was this ever needed, and is this still needed?
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  setupFiles: ['jest-canvas-mock', 'fake-indexeddb/auto'], //TODO SHOULD setup.js be loaded here instead of after env? (see next line)
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true,
  resetModules: true,
  moduleNameMapper: {
    'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js',
    '^!!raw-loader!.*': 'jest-raw-loader',
    '^vuetify/components$': '<rootDir>/node_modules/vuetify/lib/components/index.mjs', //TODO desperate attempt without effect
    '^vuetify/directives$': '<rootDir>/node_modules/vuetify/lib/directives/index.mjs', //TODO desperate attempt without effect
  },
  //added according to https://github.com/vuejs/vue-jest
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue2-jest',
  },
};
