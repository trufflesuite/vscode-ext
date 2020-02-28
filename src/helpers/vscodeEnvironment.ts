// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export async function writeToClipboard(text: string): Promise<void> {
  return vscode.env.clipboard.writeText(text);
}
