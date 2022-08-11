import mockery from 'mockery';
import * as vscode from './vscode';

// This option is used to omit `WARNING: loading non-allowed module` log message.
//
// https://github.com/mfncooper/mockery/issues/27
mockery.enable({warnOnUnregistered: false});

// We use `mockery`[1] to provide a drop-in replacement for `vscode` module.
// The `vscode` module is not available when running `mocha` from the command line.
//
// We replace the original `vscode` with `test/vscode.ts`.
// `test/vscode.ts` provides just the minimal definitions needed to run our tests.
// Most of the definitions need no implementation, not even the proper signature,
// since the tests themselves mock them using `sinon`.
//
// This is inspired by [2].
// `mockery` is the equivalent of `jest.mock`.
//
// [1] https://github.com/mfncooper/mockery#enabling-mockery
// [2] https://github.com/mhutchie/vscode-git-graph/blob/d7f43f429a9e024e896bac9fc65fdc530935c812/tests/commands.test.ts#L3
mockery.registerMock('vscode', vscode);
