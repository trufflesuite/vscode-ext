// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
import { Constants } from '../../Constants';
import { getWorkspaceRoot } from '../../helpers';
import { TruffleConfiguration } from '../../helpers/truffleConfig';
import { Output } from '../../Output';
import { IOZAsset, OpenZeppelinService, OZAssetType } from './OpenZeppelinService';

const migrationFilename = '99_deploy_openzeppelin.js';

export namespace OpenZeppelinMigrationsService {
  export async function generateMigrations(items: IOZAsset[]): Promise<void> {
    const declarationSection = generateDeclarationSection(items).concat('\n');
    const contractDeployerSection = generateContractDeployerSection(items);
    const librariesDeployerSection = generateLibrariesDeployerSection(items);
    const librariesLinkingSection = (await generateLinkingSection(items)).join('\n');

    if (contractDeployerSection || librariesDeployerSection) {
      const migrationContent = [
        declarationSection,
        'module.exports = deployer => {',
        librariesDeployerSection,
        librariesLinkingSection,
        contractDeployerSection,
        '};',
      ].join('\n');

      saveMigrationContent(migrationContent);
    }
  }
}

function generateDeclarationSection(items: IOZAsset[]): string {
  return items
    .filter((asset: IOZAsset) => asset.type === OZAssetType.contract || asset.type === OZAssetType.library)
    .map((asset: IOZAsset) => {
      return `var ${path.basename(asset.id)} = artifacts.require("${path.parse(asset.name).name}");`;
    })
    .join('\n');
}

function generateContractDeployerSection(items: IOZAsset[]): string {
  return items
    .filter((asset: IOZAsset) => asset.type === OZAssetType.contract)
    .map((asset: IOZAsset) => {
      return `    deployer.deploy(${path.basename(asset.id)});`;
    })
    .join('\n');
}

function generateLibrariesDeployerSection(items: IOZAsset[]): string {
  return items
    .filter((asset: IOZAsset) => asset.type === OZAssetType.library)
    .map((asset: IOZAsset) => {
      return `    deployer.deploy(${path.basename(asset.id)});`;
    })
    .join('\n');
}

async function generateLinkingSection(items: IOZAsset[]): Promise<string[]> {
  const librariesLinkingSection: string[] = [];
  items
    .filter((asset: IOZAsset) => asset.type === OZAssetType.contract)
    .forEach(async (asset: IOZAsset) => {
      librariesLinkingSection.push(
        ...contractToLibraryLinkingSection(
          asset,
          await OpenZeppelinService.getReferencesToLibraries(asset),
        ),
      );
    });
  return librariesLinkingSection;
}

function contractToLibraryLinkingSection(baseContract: IOZAsset, libraries: IOZAsset[]): string[] {
  const librariesLinkingSection: string[] = [];
  libraries.forEach((asset: IOZAsset) => {
    librariesLinkingSection.push(`    deployer.link(${path.basename(asset.id)}, ${path.basename(baseContract.id)});`);
  });
  return librariesLinkingSection;
}

async function saveMigrationContent(content: string): Promise<void> {
  const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
  const truffleConfig = new TruffleConfiguration.TruffleConfig(truffleConfigPath);
  const configuration = truffleConfig.getConfiguration();
  const migrationFilePath = configuration.migrations_directory;

  Output.outputLine(
    Constants.outputChannel.azureBlockchain,
    `New migration for OpenZeppelin contracts was stored to file ${migrationFilename}`,
  );

  const filePath = path.join(
    getWorkspaceRoot()!,
    migrationFilePath,
    migrationFilename,
  );
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
}
