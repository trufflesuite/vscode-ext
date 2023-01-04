// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {RequiredApps} from '@/Constants';
import {Telemetry} from '@/Telemetry';
import {executeCommand} from './command';
import {required} from './required';

export async function gitInit(workingDirectory: string): Promise<void> {
  if (!(await required.checkRequiredApps())) {
    return;
  }

  if (!(await isRepoExists(workingDirectory))) {
    await executeCommand(workingDirectory, RequiredApps.git, 'init');
  }
}

async function isRepoExists(workingDirectory: string): Promise<boolean> {
  try {
    await executeCommand(workingDirectory, RequiredApps.git, 'rev-parse', '--git-dir');
  } catch (error) {
    Telemetry.sendException(error as Error);
    return false;
  }
  return true;
}
