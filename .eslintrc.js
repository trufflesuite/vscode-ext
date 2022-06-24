module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // Adding this in future would be good but its problematic.
    // "plugin:@typescript-eslint/recommended-requiring-type-checking",
    'prettier',
  ],
  ignorePatterns: ['ui-test/**/*.ts', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/ban-ts-comment': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/ban-types': [
      'off',
      {
        types: {
          Object: {
            message: 'Avoid using the `Object` type. Did you mean `object`?',
          },
          Function: {
            message: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
          },
          Boolean: {
            message: 'Avoid using the `Boolean` type. Did you mean `boolean`?',
          },
          Number: {
            message: 'Avoid using the `Number` type. Did you mean `number`?',
          },
          String: {
            message: 'Avoid using the `String` type. Did you mean `string`?',
          },
          Symbol: {
            message: 'Avoid using the `Symbol` type. Did you mean `symbol`?',
          },
        },
      },
    ],

    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': ['error'],

    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-empty-interface': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-explicit-any': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-namespace': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-var-requires': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/prefer-namespace-keyword': 'off',
    '@typescript-eslint/triple-slash-reference': [
      'warn',
      {
        path: 'always',
        types: 'prefer-import',
        lib: 'always',
      },
    ],

    'no-constant-condition': ['error', {checkLoops: false}],
    // FIXME: tech-debt.
    'no-extra-boolean-cast': 'off',
    // FIXME: rework this eventually. Tech-debt
    'no-inner-declarations': 'off',
    // FIXME: rework this eventually. Tech-debt
    'no-prototype-builtins': 'off',
    // FIXME: This needs removed. Tech-Debt
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-useless-escape': 'off',
    'no-use-before-define': 'off',
    // FIXME: rework this eventually. Tech-debt
    'no-var': 'off',
  },
};
