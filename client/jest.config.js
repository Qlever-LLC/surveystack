module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: ['/node_modules/(?!ol)'],
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true,
  resetModules: true,
};
