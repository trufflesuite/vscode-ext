// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as fs from 'fs';
import { InputBoxOptions, QuickPickItem, QuickPickOptions, Uri, window, workspace } from 'vscode';
import { Constants } from '../Constants';
import { CancellationEvent } from '../Models';
import { Telemetry } from '../TelemetryClient';
import { DialogResultValidator } from '../validators/DialogResultValidator';

export async function showInputBox(options: InputBoxOptions): Promise<string> {
  const result = await window.showInputBox(options);

  if (result === undefined) {
    Telemetry.sendEvent('userInteraction.showInputBox.userCancellation', { prompt: options.prompt || '' });
    throw new CancellationEvent();
  }

  return result;
}

export async function showQuickPick<T extends QuickPickItem>(items: T[] | Promise<T[]>, options: QuickPickOptions)
  : Promise<T> {
  const result = await window.showQuickPick(items, options);

  if (result === undefined) {
    Telemetry.sendEvent('userInteraction.showQuickPick.userCancellation', { placeHolder: options.placeHolder || '' });
    throw new CancellationEvent();
  }

  return result;
}

export async function showConfirmDialog(yesDescription?: string, noDescription?: string): Promise<string> {
  const answer = await showQuickPick(
    [
      { label: Constants.confirmationDialogResult.no, description: noDescription },
      { label: Constants.confirmationDialogResult.yes, description: yesDescription },
    ], {
    ignoreFocusOut: true,
    placeHolder: Constants.placeholders.confirmDialog,
  });

  return answer.label;
}

export async function showConfirmPaidOperationDialog() {
  const answer = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.placeholders.confirmPaidOperation,
    validateInput: DialogResultValidator.validateConfirmationResult,
  });

  if (answer.toLowerCase() !== Constants.confirmationDialogResult.yes) {
    Telemetry.sendEvent(
      'userInteraction.showConfirmPaidOperationDialog.userCancellation',
      { prompt: Constants.placeholders.confirmPaidOperation });
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
    Telemetry.sendEvent(
      'userInteraction.showOpenFolderDialog.userCancellation',
      { label: Constants.placeholders.selectNewProjectPath });
    throw new CancellationEvent();
  }

  return folder[0].fsPath;
}

export async function showOpenFileDialog(): Promise<string> {
  const defaultFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : '';
  const folder = await (await window.showSaveDialog({
    defaultUri: Uri.parse(defaultFolder),
    saveLabel: Constants.placeholders.selectMnemonicStorage,
  }));

  if (!folder) {
    Telemetry.sendEvent(
      'userInteraction.showOpenFileDialog.userCancellation',
      { label: Constants.placeholders.selectMnemonicStorage });
    throw new CancellationEvent();
  }

  return folder.fsPath;
}

export async function saveTextInFile(
  text: string,
  defaultFilename: string,
  ext?: { [name: string]: string[] },
): Promise<string> {
  const file = await window.showSaveDialog({
    defaultUri: Uri.file(defaultFilename),
    filters: ext});
  if (!file) {
    Telemetry.sendEvent('userInteraction.saveTextInFile.userCancellation', { label: 'fileNotSelected' });
    throw new CancellationEvent();
  }

  fs.writeFileSync(file.fsPath, text);
  return file.fsPath;
}
