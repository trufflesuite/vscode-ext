import { ConfigurationTarget, workspace } from 'vscode';

export async function getConfigurationAsync(key: string): Promise<{ defaultValue: string, userValue: string }> {
  const config = await workspace.getConfiguration().inspect(key);

  const defaultValue = config!.defaultValue as string;
  const userValue = config!.globalValue as string;
  return { defaultValue, userValue };
}

export function updateConfigurationAsync(key: string, value: any, isGlobal: boolean = true): Thenable<void> {
  const scope = isGlobal ? ConfigurationTarget.Global : ConfigurationTarget.Workspace;
  return workspace.getConfiguration().update(key, value, scope);
}
