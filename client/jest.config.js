const esModules = ['ol', 'monaco-editor', '@farmos.org', '@our-sci/farmos-map'].join('|');

module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  setupFiles: ['jest-canvas-mock', 'fake-indexeddb/auto'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true,
  resetModules: true,
  moduleNameMapper: {
    'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js',
    '^!!raw-loader!.*': 'jest-raw-loader',
  },
};
