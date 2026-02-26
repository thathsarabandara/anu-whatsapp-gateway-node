/**
 * ESLint Configuration
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-plusplus': 'off',
    'no-param-reassign': ['error', { props: false }],
    'func-names': 'off',
    'object-shorthand': 'off',
    'prefer-arrow-callback': 'off',
    'consistent-return': 'warn',
    'no-else-return': 'warn',
    'no-use-before-define': ['error', { functions: false }],
    'prefer-destructuring': 'warn',
    'quote-props': ['error', 'as-needed', { keywords: true }],
    'no-restricted-globals': 'warn',
    'max-classes-per-file': 'off',
    'no-underscore-dangle': 'off',
    'guard-for-in': 'warn',
    'no-continue': 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};
