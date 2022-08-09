import vscode from 'vscode';

/**
 * Gets the first Workspace folder or undefined.
 */
export function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.filter((folder) => folder.uri.scheme === 'file')[0];
}
