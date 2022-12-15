import {workspace} from 'vscode';

export function getConfigurationAsync(key: string): {defaultValue: string; userValue: string} {
  const config = workspace.getConfiguration().inspect(key);

  const defaultValue = config!.defaultValue as string;
  const userValue = config!.globalValue as string;
  return {defaultValue, userValue};
}
