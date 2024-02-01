module.exports = {
  "client/{tests,src}/**/*.{js,vue}": [
    "yarn lerna --scope surveystack-client run lint -- --",
    () => "yarn lerna --scope surveystack-client run test",
  ],
  "server/{tests,src}/**/*.{js,ts}": [
    "yarn lerna --scope surveystack-server run lint-fix -- --",
    () => 'yarn lerna --scope surveystack-server run compile-ts',
    () => "yarn lerna --scope surveystack-server run test",
  ],
};
