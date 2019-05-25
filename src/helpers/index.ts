// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as outputCommandHelper from './command';
import * as commandContext from './commandContext';
import * as gitHelper from './git';
import { required } from './required';
import * as shell from './shell';
import { TruffleConfiguration } from './truffleConfig';
import * as userInteractionHelper from './userInteraction';
import * as workspaceHelpers from './workspace';

const saveTextInFile = userInteractionHelper.saveTextInFile;
const showInputBox = userInteractionHelper.showInputBox;
const showQuickPick = userInteractionHelper.showQuickPick;
const showOpenFolderDialog = userInteractionHelper.showOpenFolderDialog;
const showConfirmPaidOperationDialog = userInteractionHelper.showConfirmPaidOperationDialog;
const getWorkspaceRoot = workspaceHelpers.getWorkspaceRoot;
const isWorkspaceOpen = workspaceHelpers.isWorkspaceOpen;
const TruffleConfig = TruffleConfiguration.TruffleConfig;
const CommandContext = commandContext.CommandContext;
const setCommandContext = commandContext.setCommandContext;

export {
  CommandContext,
  getWorkspaceRoot,
  gitHelper,
  isWorkspaceOpen,
  showOpenFolderDialog,
  outputCommandHelper,
  required,
  saveTextInFile,
  setCommandContext,
  shell,
  showInputBox,
  showQuickPick,
  showConfirmPaidOperationDialog,
  TruffleConfig,
  TruffleConfiguration,
};
