// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ConfigurationTarget, workspace} from 'vscode';

export function getConfiguration(key: string): {defaultValue: string; userValue: string} {
  const config = workspace.getConfiguration().inspect<string>(key);

  const defaultValue = config!.defaultValue as string;
  const userValue = config!.globalValue as string;
  return {defaultValue, userValue};
}

export function updateConfigurationAsync(key: string, value: any, isGlobal = true): Thenable<void> {
  const scope = isGlobal ? ConfigurationTarget.Global : ConfigurationTarget.Workspace;
  return workspace.getConfiguration().update(key, value, scope);
}
