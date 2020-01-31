// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
import { OpenZeppelinService } from '..';
import { Constants } from '../../Constants';
import { Output } from '../../Output';
import { ContractService } from '../../services';
import { IOZAsset, OZAssetType } from './models';
import { OpenZeppelinProjectJsonService } from './OpenZeppelinProjectJsonService';

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

      return saveMigrationContent(migrationContent);
    }
  }
}

function generateDeclarationSection(items: IOZAsset[]): string {
  return items
    .filter((asset: IOZAsset) =>
    OpenZeppelinService.assetHasContracts(asset) || asset.type === OZAssetType.library)
    .reduce((declarations: string[], asset: IOZAsset) => {
      const contractNames = OpenZeppelinService.getContractsNamesFromAsset(asset);

      return declarations.concat(
        contractNames.map((contract) => `var ${contract} = artifacts.require("${contract}");`));
    }, [])
    .join('\n');
}

function generateContractDeployerSection(items: IOZAsset[]): string {
  return items
    .filter((asset: IOZAsset) => OpenZeppelinService.assetHasContracts(asset))
    .reduce((deployerSections: string[], asset: IOZAsset) => {
      const contractNames = OpenZeppelinService.getContractsNamesFromAsset(asset);

      return deployerSections
        .concat(contractNames.map((contract) => {
          const contractParameters = OpenZeppelinService.getContractParametersFromAsset(asset, contract);
          return `    deployer.deploy(${[contract, ...contractParameters].join(', ')});`;
        }));
    }, [])
    .join('\n');
}

function generateLibrariesDeployerSection(items: IOZAsset[]): string {
  return items
    .filter((asset: IOZAsset) => asset.type === OZAssetType.library)
    .reduce((deployerSections: string[], asset: IOZAsset) => {
      const libraryName = OpenZeppelinService.getContractNameByAssetName(asset);
      const libraryDeploySection = `    deployer.deploy(${libraryName});`;
      deployerSections.push(libraryDeploySection);
      return deployerSections;
    }, [])
    .join('\n');
}

async function generateLinkingSection(items: IOZAsset[]): Promise<string[]> {
  const librariesLinkingSection: string[] = [];
  const contracts = items.filter((asset) => OpenZeppelinService.assetHasContracts(asset));

  for (const contract of contracts) {
    librariesLinkingSection.push(
      ...contractToLibraryLinkingSection(
        contract,
        await OpenZeppelinProjectJsonService.getReferencesToLibrariesAsync(contract),
      ),
    );
  }

  return librariesLinkingSection;
}

function contractToLibraryLinkingSection(baseAsset: IOZAsset, libraries: IOZAsset[]): string[] {
  const contractsNames = OpenZeppelinService.getContractsNamesFromAsset(baseAsset);
  const librariesNames = libraries.map(OpenZeppelinService.getContractNameByAssetName);

  return contractsNames.reduce((deployerLinks: string[], contractName: string) => {
    return deployerLinks.concat(
      librariesNames.map((libraryName) => (`    deployer.link(${libraryName}, ${contractName});`)));
  }, []);
}

async function saveMigrationContent(content: string): Promise<void> {
  const migrationFolderPath = await ContractService.getMigrationFolderPath();
  const filePath = path.join(migrationFolderPath, migrationFilename,
  );

  Output.outputLine(
    Constants.outputChannel.azureBlockchain,
    `New migration for OpenZeppelin contracts was stored to file ${migrationFilename}`,
  );

  return fs.writeFile(filePath, content, { encoding: 'utf8' });
}
