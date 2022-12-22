// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {env} from 'vscode';

export async function writeToClipboard(text: string): Promise<void> {
  return env.clipboard.writeText(text);
}
