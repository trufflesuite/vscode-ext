// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProgressLocation, window } from 'vscode';
import { showConfirmDialogToUpdateOpenZeppelin, userSettings } from '.';
import { Constants } from '../Constants';
import { OpenZeppelinService } from '../services';
import { CurrentOpenZeppelinVersionLocation, InvalidOpenZeppelinVersionException } from '../services/openZeppelin/InvalidOpenZeppelinVersionException';
import { IOZMetadata } from '../services/openZeppelin/models';
import { OpenZeppelinManifest } from '../services/openZeppelin/OpenZeppelinManifest';
import { Telemetry } from '../TelemetryClient';

export async function createManifestAsync(version: string): Promise<OpenZeppelinManifest> {
  const metadata = await getManifestMetadata(version);
  return new OpenZeppelinManifest(metadata);
}

export async function tryGetCurrentOpenZeppelinVersionAsync(): Promise<string> {
  try {
    return await OpenZeppelinService.getCurrentOpenZeppelinVersionAsync();
  } catch (ex) {
    if (ex instanceof InvalidOpenZeppelinVersionException) {
      const error = ex as InvalidOpenZeppelinVersionException;
      const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();
      const message = Constants.openZeppelin.invalidVersionDialog(
        error.invalidVersion,
        error.location === CurrentOpenZeppelinVersionLocation.projectJson ? 'project.json' : 'UserSettings',
        latestVersion,
      );
      const answer = await window.showInformationMessage(
        message,
        Constants.confirmationDialogResult.yes,
        Constants.confirmationDialogResult.no);

      if (answer !== Constants.confirmationDialogResult.yes) {
        throw ex;
      }

      await OpenZeppelinService.setVersionAsync(latestVersion, error.location);

      return OpenZeppelinService.getCurrentOpenZeppelinVersionAsync();
    }

    throw ex;
  }
}

export async function shouldUpgradeOpenZeppelinAsync(): Promise<boolean> {
  const currentVersion = await tryGetCurrentOpenZeppelinVersionAsync();
  const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();

  return currentVersion !== latestVersion && await showConfirmDialogToUpdateOpenZeppelin();
}

export async function upgradeOpenZeppelinUserSettingsAsync() {
  const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();

  Telemetry.sendEvent('OpenZeppelinService.updateOpenZeppelin.userSettings');
  return userSettings.updateConfigurationAsync(Constants.ozVersionUserSettingsKey, latestVersion);
}

export async function upgradeOpenZeppelinContractsAsync()
: Promise<void> {
  await window.withProgress({
    location: ProgressLocation.Notification,
    title: Constants.openZeppelin.upgradeOpenZeppelin,
  }, async () => {
    const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();
    const manifest = await createManifestAsync(latestVersion);

    return OpenZeppelinService.updateOpenZeppelinContractsAsync(manifest);
  });
}

function getManifestMetadata(version: string): IOZMetadata {
  return require(`../services/openZeppelin/manifest-${version}.json`) as IOZMetadata;
}
