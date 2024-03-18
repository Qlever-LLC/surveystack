module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended', 'prettier', 'plugin:storybook/recommended'],
  plugins: ['import', 'prettier'],
  ignorePatterns: ['marked.esm.js'],
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
    'vue/multi-word-component-names': 'warn', //TODO fix them and set to error again
    'vue/no-v-text-v-html-on-component': 'warn', //TODO fix them and set to error again
    'vue/no-mutating-props': 'warn', //TODO fix them and set to error again
    'vue/no-unused-vars': 'warn', //TODO fix them and set to error again
    'vue/valid-v-slot': 'warn', //TODO fix them and set to error again
    'vue/no-v-for-template-key-on-child': 'warn', //TODO SEE https://stackoverflow.com/questions/71290457/how-to-get-rid-of-eslint-error-template-v-for-key-should-be-placed-on-the-tem
  },
  globals: {},
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
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
