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
  //preset: '@vue/cli-plugin-unit-jest/preset', //TODO was this ever needed, and is this still needed?
  preset: '@vue/cli-plugin-unit-jest', //TODO was this ever needed, and is this still needed?
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  //transformIgnorePatterns: [`<rootDir>/node_modules/`],
  setupFiles: ['jest-canvas-mock', 'fake-indexeddb/auto'], //TODO SHOULD setup.js be loaded here instead of after env? (see next line)
  setupFilesAfterEnv: ['./tests/setup.js'], //TODO is ./ correct, or should it be <rootDir> ?
  clearMocks: true,
  resetModules: true,
  moduleNameMapper: {
    'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js',
    '^!!raw-loader!.*': 'jest-raw-loader',
    '^vuetify/components$': '<rootDir>/node_modules/vuetify/lib/components/index.mjs', //TODO desperate attempt without effect
    '^vuetify/directives$': '<rootDir>/node_modules/vuetify/lib/directives/index.mjs', //TODO desperate attempt without effect
    '^@/(.*)$': '<rootDir>/src/$1', //TODO desperate attempt based on https://dev.to/imomaliev/creating-vite-vue-ts-template-setup-jest-5h1i, without effect
  },
  //added according to https://github.com/vuejs/vue-jest
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
    '.+\\.(css|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub', //TODO desperate attempt based on https://stackoverflow.com/questions/65253449/how-to-fix-vue-jest-error-syntaxerror-unexpected-token-export
    '^.+\\.js?$': 'babel-jest', //TODO desperate attempt based on https://stackoverflow.com/questions/65253449/how-to-fix-vue-jest-error-syntaxerror-unexpected-token-export
  },
  testEnvironment: 'jsdom', //TODO desperate attempt based on https://dev.to/imomaliev/creating-vite-vue-ts-template-setup-jest-5h1i, without effect
};
