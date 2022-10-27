// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import fs from 'fs';
import {InputBoxOptions, ProgressLocation, QuickPickItem, QuickPickOptions, Uri, window, workspace} from 'vscode';
import {Constants, NotificationOptions} from '@/Constants';
import {CancellationEvent} from '@/Models';
import {Telemetry} from '@/TelemetryClient';
import {DialogResultValidator} from '@/validators/DialogResultValidator';

export async function showInputBox(options: InputBoxOptions): Promise<string> {
  const result = await window.showInputBox(options);

  if (result === undefined) {
    Telemetry.sendEvent('userInteraction.showInputBox.userCancellation', {prompt: options.prompt || ''});
    throw new CancellationEvent();
  }

  return result;
}

export async function showQuickPickMany<T extends QuickPickItem>(
  items: T[] | Promise<T[]>,
  options: QuickPickOptions & {canPickMany: true}
): Promise<T[]> {
  const result = await window.showQuickPick(items, options);

  if (result === undefined) {
    Telemetry.sendEvent('userInteraction.showQuickPickMany.userCancellation', {
      placeHolder: options.placeHolder || '',
    });
    throw new CancellationEvent();
  }

  return result;
}

export async function showQuickPick<T extends QuickPickItem>(
  items: T[] | Promise<T[]>,
  options: QuickPickOptions
): Promise<T> {
  const result = await window.showQuickPick(items, options);

  if (result === undefined) {
    Telemetry.sendEvent('userInteraction.showQuickPick.userCancellation', {placeHolder: options.placeHolder || ''});
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

  if (answer.toLowerCase() !== Constants.confirmationDialogResult.yes.toLowerCase()) {
    Telemetry.sendEvent('userInteraction.showConfirmPaidOperationDialog.userCancellation', {
      prompt: Constants.placeholders.confirmPaidOperation,
    });
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
    Telemetry.sendEvent('userInteraction.showOpenFolderDialog.userCancellation', {
      label: Constants.placeholders.selectNewProjectPath,
    });
    throw new CancellationEvent();
  }

  return folder[0].fsPath;
}

export async function showOpenFileDialog(): Promise<string> {
  const defaultFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : '';
  const folder = await window.showSaveDialog({
    defaultUri: Uri.parse(defaultFolder),
    saveLabel: Constants.placeholders.selectMnemonicStorage,
  });

  if (!folder) {
    Telemetry.sendEvent('userInteraction.showOpenFileDialog.userCancellation', {
      label: Constants.placeholders.selectMnemonicStorage,
    });
    throw new CancellationEvent();
  }

  return folder.fsPath;
}

export async function saveTextInFile(
  text: string,
  defaultFilename: string,
  ext?: {[name: string]: string[]}
): Promise<string> {
  const file = await window.showSaveDialog({
    defaultUri: Uri.file(defaultFilename),
    filters: ext,
  });

  if (!file) {
    Telemetry.sendEvent('userInteraction.saveTextInFile.userCancellation', {label: 'fileNotSelected'});
    throw new CancellationEvent();
  }

  fs.writeFileSync(file.fsPath, text);
  return file.fsPath;
}

export async function showConfirmationDialog(message: string): Promise<boolean> {
  const answer = await window.showInformationMessage(
    message,
    Constants.confirmationDialogResult.yes,
    Constants.confirmationDialogResult.no
  );

  return answer === Constants.confirmationDialogResult.yes;
}

export async function showNotification(options: Notification.IShowNotificationOptions): Promise<void> {
  options.type = options.type || NotificationOptions.info;

  Notification.types[options.type](options.message);
}

export async function showIgnorableNotification(message: string, fn: () => Promise<any>): Promise<void> {
  const ignoreNotification = workspace.getConfiguration('truffle-vscode').get('ignoreLongRunningTaskNotification');

  await window.withProgress(
    {
      location: ProgressLocation.Window,
      title: message,
    },
    async () => {
      if (ignoreNotification) {
        await fn();
      } else {
        await window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: message,
          },
          fn
        );
      }
    }
  );
}

export async function showNotificationConfirmationDialog(
  message: string,
  positiveAnswer: string,
  cancel: string
): Promise<boolean> {
  const answer = await window.showInformationMessage(message, positiveAnswer, cancel);

  return answer === positiveAnswer;
}

namespace Notification {
  export const types = {
    error: window.showErrorMessage,
    info: window.showInformationMessage,
    warning: window.showWarningMessage,
  };

  export interface IShowNotificationOptions {
    type?: NotificationOptions.error | NotificationOptions.warning | NotificationOptions.info;
    message: string;
  }
}
