module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/prettier', 'plugin:storybook/recommended'],
  plugins: ['import'],
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
  },
  globals: {},
  parserOptions: {
    parser: 'babel-eslint',
  },
  overrides: [
    {
      files: ['**/*.spec.js'],
      env: {
        jest: true,
      },
    },
  ],
};
