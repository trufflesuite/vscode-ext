// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as outputCommandHelper from './command';
import * as commandContext from './commandContext';
import { extractEnumsInfo, extractEnumsInfoSafe } from './enumExtractor';
import * as gitHelper from './git';
import * as openZeppelinHelper from './openZeppelinHelper';
import { required } from './required';
import * as shell from './shell';
import * as telemetryHelper from './telemetry';
import { TruffleConfiguration } from './truffleConfig';
import * as userSettings from './userSettings';
import * as vscodeEnvironment from './vscodeEnvironment';
import * as workspaceHelpers from './workspace';

const spawnProcess = outputCommandHelper.spawnProcess;
const getWorkspaceRoot = workspaceHelpers.getWorkspaceRoot;
const isWorkspaceOpen = workspaceHelpers.isWorkspaceOpen;
const TruffleConfig = TruffleConfiguration.TruffleConfig;
const CommandContext = commandContext.CommandContext;
const setCommandContext = commandContext.setCommandContext;

export * from './userInteraction';

export {
  CommandContext,
  extractEnumsInfo,
  extractEnumsInfoSafe,
  getWorkspaceRoot,
  gitHelper,
  isWorkspaceOpen,
  openZeppelinHelper,
  outputCommandHelper,
  required,
  setCommandContext,
  shell,
  spawnProcess,
  telemetryHelper,
  TruffleConfig,
  TruffleConfiguration,
  userSettings,
  vscodeEnvironment,
};
