module.exports = {
  '{tests,src}/**/*.{js,vue}': ['vue-cli-service lint', () => 'vue-cli-service test:unit'],
};
