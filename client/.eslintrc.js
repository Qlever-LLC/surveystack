module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/prettier', 'plugin:storybook/recommended'],
  plugins: ['import', 'unused-imports'],
  rules: {
    'import/no-cycle': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'off' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': 0,
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'no-unused-vars': 1,
    'no-continue': 0,
    'no-param-reassign': 1,
    'brace-style': 1,
    'vue/no-unused-components': 'warn',
    'vue/multi-word-component-names': 0,
    'vue/no-v-text-v-html-on-component': 0,
    'vue/valid-v-slot': 0,
    'vue/no-unused-vars': 0,
    'vue/no-mutating-props': 0,
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
  },
  globals: {},
  parser: 'vue-eslint-parser',
  overrides: [
    {
      files: ['**/*.spec.js'],
      env: {
        jest: true,
      },
    },
  ],
};
