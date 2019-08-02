// workaround to load native modules
// (since https://github.com/Microsoft/vscode/issues/658 doesn't work on win10)
import nativeModulesLoader from './debugAdapter/nativeModules/loader';
nativeModulesLoader();

import { SolidityDebugSession } from './debugAdapter/debugSession';

SolidityDebugSession.run(SolidityDebugSession);
