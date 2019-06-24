// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export async function openExternal(uri: vscode.Uri): Promise<boolean> {
  return vscode.env.openExternal(uri);
}

export async function writeToClipboard(text: string): Promise<void> {
  return vscode.env.clipboard.writeText(text);
}
