// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as outputCommandHelper from './command';
import * as commandContext from './commandContext';
import {extractEnumsInfo, extractEnumsInfoSafe} from './enumExtractor';
import * as gitHelper from './git';
import * as shell from './shell';
import * as telemetryHelper from './telemetry';
import * as userSettings from './userSettings';
import * as vscodeEnvironment from './vscodeEnvironment';

const spawnProcess = outputCommandHelper.spawnProcess;
const CommandContext = commandContext.CommandContext;
const setCommandContext = commandContext.setCommandContext;

export {
  CommandContext,
  extractEnumsInfo,
  extractEnumsInfoSafe,
  gitHelper,
  outputCommandHelper,
  setCommandContext,
  shell,
  spawnProcess,
  telemetryHelper,
  userSettings,
  vscodeEnvironment,
};
