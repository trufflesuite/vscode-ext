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
import * as workspaceHelpers from './workspace';

const spawnProcess = outputCommandHelper.spawnProcess;
const getWorkspaceRoot = workspaceHelpers.getWorkspaceRoot;
const getWorkspace = workspaceHelpers.getWorkspace;
const isWorkspaceOpen = workspaceHelpers.isWorkspaceOpen;
const CommandContext = commandContext.CommandContext;
const setCommandContext = commandContext.setCommandContext;

export {
  CommandContext,
  extractEnumsInfo,
  extractEnumsInfoSafe,
  getWorkspaceRoot,
  getWorkspace,
  gitHelper,
  isWorkspaceOpen,
  outputCommandHelper,
  setCommandContext,
  shell,
  spawnProcess,
  telemetryHelper,
  userSettings,
  vscodeEnvironment,
};
