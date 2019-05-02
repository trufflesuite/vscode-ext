// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as fs from 'fs';
import { InputBoxOptions, QuickPickItem, QuickPickOptions, Uri, window, workspace } from 'vscode';
import { Constants } from '../Constants';
import { CancellationEvent } from '../Models';
import { DialogResultValidator } from '../validators/DialogResultValidator';

export async function showInputBox(options: InputBoxOptions): Promise<string> {
  const result = await window.showInputBox(options);

  if (result === undefined) {
    throw new CancellationEvent();
  }

  return result;
}

export async function showQuickPick<T extends QuickPickItem>(items: T[] | Promise<T[]>, options: QuickPickOptions)
  : Promise<T> {
  const result = await window.showQuickPick(items, options);

  if (result === undefined) {
    throw new CancellationEvent();
  }

  return result;
}

export async function showConfirmPaidOperationDialog() {
  const answer = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.placeholders.confirmPaidOperation,
    validateInput: DialogResultValidator.validateConfirmationResult,
  });

  if (answer.toLowerCase() !== Constants.confirmationDialogResult.yes) {
    throw new CancellationEvent();
  }
}

export async function showOpenFolderDialog(): Promise<string> {
  const folder = await window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: Constants.placeholders.selectNewProjectPath,
  });

  if (!folder) {
    throw new CancellationEvent();
  }

  return folder[0].fsPath;
}

export async function showOpenFileDialog(): Promise<string> {
  const defaultFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : '';
  const folder = await (await window.showSaveDialog({
    defaultUri: Uri.parse(defaultFolder),
    saveLabel: 'Select mnemonic storage',
  }));

  if (!folder) {
    throw new CancellationEvent();
  }

  return folder.fsPath;
}

export async function saveTextInFile(
  text: string,
  defaultFilename: string,
  ext?: { [name: string]: string[] },
): Promise<string> {
  const document = await workspace.openTextDocument({content: text});
  await window.showTextDocument(document);
  const file = await window.showSaveDialog({
    defaultUri: Uri.file(defaultFilename) ,
    filters: ext});
  if (!file) {
    throw new CancellationEvent();
  }

  fs.writeFileSync(file.fsPath, text);
  return file.fsPath;
}
