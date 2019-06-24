// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { executeCommand } from './command';
import { required } from './required';

export async function gitInit(workingDirectory: string): Promise<void> {
  if (!await required.checkRequiredApps()) {
    return;
  }

  if (!await isRepoExists(workingDirectory)) {
    await executeCommand(workingDirectory, Constants.gitCommand, 'init');
  }
}

export async function isRepoExists(workingDirectory: string): Promise<boolean> {
  try {
    await executeCommand(workingDirectory, Constants.gitCommand, 'rev-parse', '--git-dir');
  } catch (error) {
    return false;
  }
  return true;
}
