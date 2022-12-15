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
    // We add this, but warn/off specific rules.
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  ignorePatterns: ['ui-test/**/*.ts', '.eslintrc.js', 'webpack*.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': ['error'],

    // We can ignore vars in overridden methods with this rule.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],

    // need this as we have a few while(true) loops.
    'no-constant-condition': ['error', {checkLoops: false}],

    // FIXME: rework this eventually. Tech-debt - 200+ warnings right now.
    '@typescript-eslint/no-explicit-any': 'off',

    // FIXME: rework this eventually. Tech-debt - 24 Issues. Prob quite complex rework.
    '@typescript-eslint/no-namespace': 'off',

    // FIXME: rework this eventually. Tech-debt  - 70 Warnings
    '@typescript-eslint/no-non-null-assertion': 'off',
    // FIXME: rework this eventually. Tech-debt - cant enable this - some require code/voodoo hacks.
    '@typescript-eslint/no-var-requires': 'off',
    // FIXME: rework this eventually. Tech-debt - 55 Errors
    'no-inner-declarations': 'off',
    // FIXME: rework this eventually. Tech-debt - 4 hasOwnProperty Errors
    'no-prototype-builtins': 'off',
    // FIXME: This needs removed. Tech-Debt - 1 error for web3 in a voodoo JS script.
    'no-undef': 'off',
    // FIXME: rework this eventually. Tech-debt - 8 Errors right now. Needs investigation.
    // '@typescript-eslint/ban-ts-comment': 'off',

    '@typescript-eslint/explicit-module-boundary-types': 'warn',

    // The following two blocks come from `@typescript-eslint/recommended-requiring-type-checking`.

    // FIXME: We need to take care of this.
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/restrict-plus-operands': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/unbound-method': ['warn', {ignoreStatic: true}],

    // FIXME: Most of these rules appears in tests, we need a major test refactor to enable these checks.
    // They are disable because otherwise they become too annoying.
    // Once we solve the rest, we can come back and solve these.
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
  },
};
