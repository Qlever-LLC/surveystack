/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  verbose: true,
  testMatch: ['**/?(*.)+(spec).js', '**/?(*.)+(spec).ts'],
  resetModules: true,
  resetMocks: true,
  moduleFileExtensions: ['js', 'ts', 'd.ts'],
  preset: 'ts-jest/presets/js-with-ts',
  setupFilesAfterEnv: ['./tests/setupInMemoryMongo.ts'],
};
