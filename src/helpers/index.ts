// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// export * from './command';
// export * from './commandContext';
// export * from './enumExtractor';
// export * from './git';
// export * from './required';
// export * from './shell';
// export * from './userInteraction';
// export * from './vscodeEnvironment';
// export * from './workspace';

import * as outputCommandHelper from './command';
import * as commandContext from './commandContext';
import { extractEnumsInfo, extractEnumsInfoSafe } from './enumExtractor';
import * as gitHelper from './git';
import { required } from './required';
import * as shell from './shell';
import { TruffleConfiguration } from './truffleConfig';
import * as userInteractionHelper from './userInteraction';
import * as vscodeEnvironment from './vscodeEnvironment';
import * as workspaceHelpers from './workspace';

const saveTextInFile = userInteractionHelper.saveTextInFile;
const showConfirmDialog = userInteractionHelper.showConfirmDialog;
const showInputBox = userInteractionHelper.showInputBox;
const showQuickPick = userInteractionHelper.showQuickPick;
const showOpenFolderDialog = userInteractionHelper.showOpenFolderDialog;
const showConfirmPaidOperationDialog = userInteractionHelper.showConfirmPaidOperationDialog;
const spawnProcess = outputCommandHelper.spawnProcess;
const getWorkspaceRoot = workspaceHelpers.getWorkspaceRoot;
const isWorkspaceOpen = workspaceHelpers.isWorkspaceOpen;
const TruffleConfig = TruffleConfiguration.TruffleConfig;
const CommandContext = commandContext.CommandContext;
const setCommandContext = commandContext.setCommandContext;

export {
  CommandContext,
  extractEnumsInfo,
  extractEnumsInfoSafe,
  getWorkspaceRoot,
  gitHelper,
  isWorkspaceOpen,
  showOpenFolderDialog,
  outputCommandHelper,
  required,
  saveTextInFile,
  setCommandContext,
  shell,
  showConfirmDialog,
  showInputBox,
  showQuickPick,
  showConfirmPaidOperationDialog,
  spawnProcess,
  TruffleConfig,
  TruffleConfiguration,
  vscodeEnvironment,
};
