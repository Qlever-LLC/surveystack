module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: ['/node_modules/(?!ol)'],
  // transformIgnorePatterns: ['/node_modules/'],
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  resetMocks: true,
  resetModules: true,
};
