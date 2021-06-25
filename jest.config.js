module.exports = {
	verbose: true,
	testMatch: ['**/?(*.)+(spec).js'],
	resetModules: true,
	resetMocks: true,
	moduleFileExtensions: ['js'],
	setupFilesAfterEnv: ['./tests/setupTests.js'],
};
