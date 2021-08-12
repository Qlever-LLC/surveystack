module.exports = {
  'client/{tests,src}/**/*.{js,vue}': ['yarn lerna --scope surveystack-client run lint -- --', () => 'yarn lerna --scope surveystack-client run test'],
};
