/**
 * This configuration[1] is used when `mocha` is invoked directly
 * from the command line.
 *
 * Note that this configuration does not affect tests
 * when they are executed through `runTests`.
 *
 * [1] https://mochajs.org/#configuring-mocha-nodejs
 */
module.exports = {
  require: [
    // We use `ts-node/register`[1] to run our tests without compiling them.
    //
    // [1] https://typestrong.org/ts-node/docs/recipes/mocha/#mocha-7-and-newer.
    'ts-node/register',

    // This option is used to provide a drop-in replacement for the `vscode` module.
    // When running `mocha` tests without a VS Code Development Extension Host[1],
    // the `vscode` module is not available, so we need to provide a test replacement.
    //
    // See `test/vscode-register.ts` for more details on how this is implemented.
    //
    // This answer[2]'s 'bonus track' section was used as a inspiration for this method,
    // to run code before the tests begin.
    //
    // [1] https://code.visualstudio.com/api/working-with-extensions/testing-extension
    // [2] https://stackoverflow.com/questions/10561598/global-before-and-beforeeach-for-mocha/51152004#51152004
    'test/vscode-register.ts',
  ],

  // Currently only this subset of our tests pass.
  spec: ['test/**/*.test.ts'],
};
