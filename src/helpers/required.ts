// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs-extra";
import * as path from "path";
import * as semver from "semver";
import { commands, ProgressLocation, window } from "vscode";
import { Constants, RequiredApps } from "../Constants";
import { getWorkspaceRoot } from "../helpers";
import { Output } from "../Output";
import { Telemetry } from "../TelemetryClient";
import { executeCommand, tryExecuteCommand } from "./command";
import { TruffleConfiguration } from "./truffleConfig";

export namespace required {
  export interface IRequiredVersion {
    app: string;
    isValid: boolean;
    version: string;
    requiredVersion: string | { min: string; max: string };
  }

  export enum Scope {
    locally = 1,
    global = 0,
  }

  const currentState: { [key: string]: IRequiredVersion } = {};

  const requiredApps = [RequiredApps.node, RequiredApps.npm, RequiredApps.git];
  const auxiliaryApps = [RequiredApps.python, RequiredApps.truffle, RequiredApps.ganache];

  export function isValid(version: string, minVersion: string, maxVersion?: string): boolean {
    return (
      !!semver.valid(version) && semver.gte(version, minVersion) && (maxVersion ? semver.lt(version, maxVersion) : true)
    );
  }

  /**
   * Function check all apps: Node.js, npm, git, truffle, ganache-cli, python
   * Show Requirements Page with checking showOnStartup flag
   */
  export async function checkAllApps(): Promise<boolean> {
    const valid = await checkAppsSilent(...requiredApps, ...auxiliaryApps);

    if (!valid) {
      const message = Constants.informationMessage.invalidRequiredVersion;
      const details = Constants.informationMessage.seeDetailsRequirementsPage;
      window.showErrorMessage(`${message}. ${details}`, Constants.informationMessage.detailsButton).then((answer) => {
        if (answer) {
          commands.executeCommand("trufflesuite.showRequirementsPage");
        }
      });
      commands.executeCommand("trufflesuite.showRequirementsPage", true);
    }

    return valid;
  }

  /**
   * Function check only required apps: Node.js, npm, git
   * Show Requirements Page
   */
  export async function checkRequiredApps(): Promise<boolean> {
    return checkApps(...requiredApps);
  }

  export async function checkApps(...apps: RequiredApps[]): Promise<boolean> {
    const valid = await checkAppsSilent(...apps);

    if (!valid) {
      Telemetry.sendEvent(Constants.telemetryEvents.failedToCheckRequiredApps);
      const message = Constants.errorMessageStrings.RequiredAppsAreNotInstalled;
      const details = Constants.informationMessage.seeDetailsRequirementsPage;
      window.showErrorMessage(`${message}. ${details}`);
      commands.executeCommand("trufflesuite.showRequirementsPage");
    }

    return valid;
  }

  export async function checkAppsSilent(...apps: RequiredApps[]): Promise<boolean> {
    const versions = await getExactlyVersions(...apps);
    const invalid = versions
      .filter((version) => apps.includes(version.app as RequiredApps))
      .some((version) => !version.isValid);

    Output.outputLine("checkApps", `Current state for versions: ${JSON.stringify(versions)} Invalid: ${invalid}`);
    return !invalid;
  }

  export async function checkHdWalletProviderVersion(): Promise<boolean> {
    const installedVersion = await getHdWalletProviderVersion();
    if (!installedVersion) {
      return false;
    } else {
      const requiredVersion = Constants.requiredVersions[RequiredApps.hdwalletProvider];

      if (typeof requiredVersion === "string") {
        return isValid(installedVersion, requiredVersion);
      } else {
        return isValid(
          installedVersion,
          (requiredVersion as { max: string; min: string }).min,
          (requiredVersion as { max: string; min: string }).max
        );
      }
    }
  }

  export async function getHdWalletProviderVersion(): Promise<string> {
    try {
      const data =
        fs.readFileSync(path.join(getWorkspaceRoot()!, "package-lock.json"), null) ||
        fs.readFileSync(path.join(getWorkspaceRoot()!, "package.json"), null);
      const packagesData = JSON.parse(data.toString());

      return packagesData.dependencies[RequiredApps.hdwalletProvider]
        ? packagesData.dependencies[RequiredApps.hdwalletProvider].version ||
            packagesData.dependencies[RequiredApps.hdwalletProvider]
        : "";
    } catch (error) {
      Telemetry.sendException(error as Error);
      return "";
    }
  }

  export async function getAllVersions(): Promise<IRequiredVersion[]> {
    return getExactlyVersions(...requiredApps, ...auxiliaryApps);
  }

  export async function getExactlyVersions(...apps: RequiredApps[]): Promise<IRequiredVersion[]> {
    Output.outputLine("", `Get version for required apps: ${apps.join(",")}`);

    if (apps.includes(RequiredApps.node)) {
      currentState.node = currentState.node || (await createRequiredVersion(RequiredApps.node, getNodeVersion));
    }
    if (apps.includes(RequiredApps.npm)) {
      currentState.npm = currentState.npm || (await createRequiredVersion(RequiredApps.npm, getNpmVersion));
    }
    if (apps.includes(RequiredApps.git)) {
      currentState.git = currentState.git || (await createRequiredVersion(RequiredApps.git, getGitVersion));
    }
    if (apps.includes(RequiredApps.truffle)) {
      currentState.truffle =
        currentState.truffle || (await createRequiredVersion(RequiredApps.truffle, getTruffleVersion));
    }
    if (apps.includes(RequiredApps.ganache)) {
      currentState.ganache =
        currentState.ganache || (await createRequiredVersion(RequiredApps.ganache, getGanacheVersion));
    }

    return Object.values(currentState);
  }

  export async function getNodeVersion(): Promise<string> {
    return getVersion(RequiredApps.node, "--version", /v(\d+.\d+.\d+)/);
  }

  export async function getNpmVersion(): Promise<string> {
    return getVersion(RequiredApps.npm, "--version", /(\d+.\d+.\d+)/);
  }

  export async function getGitVersion(): Promise<string> {
    return getVersion(RequiredApps.git, "--version", / (\d+.\d+.\d+)/);
  }

  export async function getPythonVersion(): Promise<string> {
    return getVersion(RequiredApps.python, "--version", / (\d+.\d+.\d+)/);
  }

  export async function getTruffleVersion(): Promise<string> {
    const requiredVersion = Constants.requiredVersions[RequiredApps.truffle];
    const minRequiredVersion = typeof requiredVersion === "string" ? requiredVersion : requiredVersion.min;
    const majorVersion = minRequiredVersion.split(".")[0];

    const localVersion = (
      await tryExecuteCommand(getWorkspaceRoot(true), `npm list --depth 0 truffle@${majorVersion}`)
    ).cmdOutput.match(/truffle@(\d+.\d+.\d+)/);

    return (
      (localVersion && localVersion[1]) || getVersion(RequiredApps.truffle, "version", /(?<=Truffle v)(\d+.\d+.\d+)/)
    );
  }

  export async function getGanacheVersion(): Promise<string> {
    const requiredVersion = Constants.requiredVersions[RequiredApps.ganache];
    const minRequiredVersion = typeof requiredVersion === "string" ? requiredVersion : requiredVersion.min;
    const majorVersion = minRequiredVersion.split(".")[0];

    const localVersion = (
      await tryExecuteCommand(getWorkspaceRoot(true), `npm list --depth 0 ganache-cli@${majorVersion}`)
    ).cmdOutput.match(/ganache-cli@(\d+.\d+.\d+)/);

    return (localVersion && localVersion[1]) || getVersion(RequiredApps.ganache, "--version", /v(\d+.\d+.\d+)/);
  }

  export async function installNpm(): Promise<void> {
    try {
      await installUsingNpm(RequiredApps.npm, Constants.requiredVersions[RequiredApps.npm]);
    } catch (error) {
      Telemetry.sendException(error as Error);
      Output.outputLine(Constants.outputChannel.requirements, (error as Error).message);
    }

    currentState.npm = await createRequiredVersion(RequiredApps.npm, getNpmVersion);
  }

  export async function installTruffle(scope?: Scope): Promise<void> {
    try {
      await installUsingNpm(RequiredApps.truffle, Constants.requiredVersions[RequiredApps.truffle], scope);
    } catch (error) {
      Telemetry.sendException(error as Error);
      Output.outputLine(Constants.outputChannel.requirements, (error as Error).message);
    }

    currentState.truffle = await createRequiredVersion(RequiredApps.truffle, getTruffleVersion);
  }

  export async function installGanache(scope?: Scope): Promise<void> {
    try {
      await installUsingNpm(RequiredApps.ganache, Constants.requiredVersions[RequiredApps.ganache], scope);
    } catch (error) {
      Telemetry.sendException(error as Error);
      Output.outputLine(Constants.outputChannel.requirements, (error as Error).message);
    }

    currentState.ganache = await createRequiredVersion(RequiredApps.ganache, getGanacheVersion);
  }

  export async function installTruffleHdWalletProvider(): Promise<void> {
    try {
      await installUsingNpm(
        RequiredApps.hdwalletProvider,
        Constants.requiredVersions[RequiredApps.hdwalletProvider],
        Scope.locally
      );
      const truffleConfigPath = await TruffleConfiguration.getTruffleConfigUri();
      const config = new TruffleConfiguration.TruffleConfig(truffleConfigPath);
      await config.importPackage(Constants.truffleConfigRequireNames.hdwalletProvider, RequiredApps.hdwalletProvider);
    } catch (error) {
      Telemetry.sendException(error as Error);
    }
  }

  export async function isHdWalletProviderRequired(): Promise<boolean> {
    try {
      const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
      const config = new TruffleConfiguration.TruffleConfig(truffleConfigPath);
      return config.isHdWalletProviderDeclared();
    } catch (error) {
      Telemetry.sendException(error as Error);
      Output.outputLine(Constants.outputChannel.requirements, (error as Error).message);
    }

    return false;
  }

  export async function isDefaultProject(): Promise<boolean> {
    try {
      // File might not exist in some truffle-box
      const data = await fs.readFile(path.join(getWorkspaceRoot()!, "package.json"), "utf-8");
      const packagesData = JSON.parse(data);

      return packagesData.name === "blockchain-ethereum-template";
    } catch (error) {
      Telemetry.sendException(error as Error);
      Output.outputLine(Constants.outputChannel.requirements, (error as Error).message);
    }

    return false;
  }

  async function createRequiredVersion(appName: string, versionFunc: () => Promise<string>): Promise<IRequiredVersion> {
    const version = await versionFunc();
    const requiredVersion = Constants.requiredVersions[appName];
    const minRequiredVersion = typeof requiredVersion === "string" ? requiredVersion : requiredVersion.min;
    const maxRequiredVersion = typeof requiredVersion === "string" ? "" : requiredVersion.max;
    const isValidApp = isValid(version, minRequiredVersion, maxRequiredVersion);

    return {
      app: appName,
      isValid: isValidApp,
      requiredVersion,
      version,
    };
  }

  async function installUsingNpm(
    packageName: string,
    packageVersion: string | { min: string; max: string },
    scope?: Scope
  ): Promise<void> {
    const versionString =
      typeof packageVersion === "string" ? `^${packageVersion}` : `>=${packageVersion.min} <${packageVersion.max}`;

    const workspaceRoot = getWorkspaceRoot(true);

    if (workspaceRoot === undefined && scope === Scope.locally) {
      const error = new Error(Constants.errorMessageStrings.WorkspaceShouldBeOpened);
      Telemetry.sendException(error);
      throw error;
    }

    await window.withProgress(
      {
        location: ProgressLocation.Window,
        title: `Installing ${packageName}@${versionString}`,
      },
      async () => {
        await executeCommand(workspaceRoot, "npm", "i", scope ? "" : "-g", ` ${packageName}@"${versionString}"`);
      }
    );
  }

  async function getVersion(program: string, command: string, matcher: RegExp): Promise<string> {
    try {
      const result = await tryExecuteCommand(undefined, program, command);
      if (result.code === 0) {
        const output = result.cmdOutput || result.cmdOutputIncludingStderr;
        const installedVersion = output.match(matcher);
        const version = semver.clean(installedVersion ? installedVersion[1] : "");

        return version || "";
      }
    } catch (error) {
      Telemetry.sendException(error as Error);
    }

    return "";
  }
}
