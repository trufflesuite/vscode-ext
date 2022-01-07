// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ProgressLocation, window } from "vscode";
import { showConfirmationDialog, showInputBox, userSettings } from ".";
import { Constants } from "../Constants";
import { CancellationEvent } from "../Models";
import { OpenZeppelinMigrationsService, OpenZeppelinProjectJsonService, OpenZeppelinService } from "../services";
import {
  CurrentOpenZeppelinVersionLocation,
  InvalidOpenZeppelinVersionException,
} from "../services/openZeppelin/InvalidOpenZeppelinVersionException";
import { IOZAsset, IOZMetadata } from "../services/openZeppelin/models";
import { OpenZeppelinManifest } from "../services/openZeppelin/OpenZeppelinManifest";
import { Telemetry } from "../TelemetryClient";
import { validateSolidityType } from "../validators/solidityTypeValidation";

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
        error.location === CurrentOpenZeppelinVersionLocation.projectJson ? "project.json" : "UserSettings",
        latestVersion
      );
      const answer = await window.showInformationMessage(
        message,
        Constants.confirmationDialogResult.yes,
        Constants.confirmationDialogResult.no
      );

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

  return currentVersion !== latestVersion && (await showConfirmationDialog(Constants.openZeppelin.newVersionAvailable));
}

export async function upgradeOpenZeppelinUserSettingsAsync() {
  const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();

  Telemetry.sendEvent("OpenZeppelinService.updateOpenZeppelin.userSettings");
  return userSettings.updateConfigurationAsync(Constants.userSettings.ozVersionUserSettingsKey, latestVersion);
}

export async function upgradeOpenZeppelinContractsAsync(): Promise<void> {
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: Constants.openZeppelin.upgradeOpenZeppelin,
    },
    async () => {
      const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();
      const manifest = await createManifestAsync(latestVersion);

      await OpenZeppelinService.updateOpenZeppelinContractsAsync(manifest);
      await OpenZeppelinMigrationsService.generateMigrations(await OpenZeppelinService.getAllDownloadedAssetsAsync());
    }
  );
}

export async function defineContractRequiredParameters(): Promise<void> {
  const assetsWithNotSpecifiedRequiredParameters = await getAssetsWithNotSpecifiedRequiredParameters();

  if (assetsWithNotSpecifiedRequiredParameters.length === 0) {
    return;
  }

  if (await showConfirmationDialog(Constants.openZeppelin.specifyContractParameters)) {
    await setContractParameters(assetsWithNotSpecifiedRequiredParameters);
  }

  await OpenZeppelinMigrationsService.generateMigrations(await OpenZeppelinService.getAllDownloadedAssetsAsync());
}

function getManifestMetadata(version: string): IOZMetadata {
  return require(`../services/openZeppelin/manifest-${version}.json`) as IOZMetadata;
}

async function setContractParameters(assets: IOZAsset[]): Promise<void> {
  const projectMetadata = await OpenZeppelinProjectJsonService.getProjectJson();
  try {
    for (const asset of assets) {
      for (const [contractName, contractParameters] of Object.entries(asset.requiredParameters!)) {
        for (const parameter of contractParameters) {
          if (!parameter.value) {
            parameter.value = await showInputBox({
              ignoreFocusOut: true,
              prompt: Constants.openZeppelin.contactParameterInformation(contractName, parameter.name, parameter.type),
              validateInput: (v) => validateSolidityType(v, parameter.type),
            });
          }
        }
      }
    }
    await OpenZeppelinProjectJsonService.addAssetsToProjectJsonAsync(assets, projectMetadata);
    await OpenZeppelinProjectJsonService.storeProjectJsonAsync(projectMetadata);
  } catch (error) {
    if (await showConfirmationDialog(Constants.openZeppelin.saveSpecifiedParameters)) {
      await OpenZeppelinProjectJsonService.addAssetsToProjectJsonAsync(assets, projectMetadata);
      await OpenZeppelinProjectJsonService.storeProjectJsonAsync(projectMetadata);
    }
    if (error instanceof CancellationEvent) {
      return;
    } else {
      throw error;
    }
  }
}

async function getAssetsWithNotSpecifiedRequiredParameters() {
  const currentOZVersion = await tryGetCurrentOpenZeppelinVersionAsync();
  const manifest = await createManifestAsync(currentOZVersion);
  const manifestAssets = manifest.getAssets();
  const currentAssets = await OpenZeppelinService.getAllDownloadedAssetsAsync();

  return currentAssets.reduce((assets, asset) => {
    const manifestAsset = manifestAssets.find((assetFromManifest) => assetFromManifest.id === asset.id);
    if (manifestAsset && !!manifestAsset.requiredParameters) {
      if (!!asset.requiredParameters) {
        for (const [contractName, contractParameters] of Object.entries(asset.requiredParameters)) {
          const manifestContractParameters = manifestAsset.requiredParameters[contractName];
          if (manifestContractParameters) {
            for (const parameter of contractParameters) {
              if (parameter.value === undefined) {
                const param = manifestContractParameters.find(
                  (manifestContractParameter) =>
                    manifestContractParameter.name === parameter.name &&
                    manifestContractParameter.type === parameter.type
                );
                if (param) {
                  assets.push(asset);
                  return assets;
                }
              }
            }
          }
        }
      } else {
        assets.push(JSON.parse(JSON.stringify(manifestAsset)));
      }
    }
    return assets;
  }, [] as IOZAsset[]);
}
