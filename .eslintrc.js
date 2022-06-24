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
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': ['error'],

    // We can ignore vars in overridden methods with this rule.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],

    // need this as we have a few while(true) loops.
    'no-constant-condition': ['error', {checkLoops: false}],

    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-empty-interface': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-explicit-any': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-namespace': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-non-null-assertion': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/no-var-requires': 'off',
    // FIXME: rework this eventually. Tech-debt
    'no-inner-declarations': 'off',
    // FIXME: rework this eventually. Tech-debt
    'no-prototype-builtins': 'off',
    // FIXME: This needs removed. Tech-Debt
    'no-undef': 'off',
    // FIXME: rework this eventually. Tech-debt
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
