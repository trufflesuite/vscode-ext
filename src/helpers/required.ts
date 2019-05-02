import * as semver from 'semver';
import { commands, window } from 'vscode';
import { Constants } from '../Constants';
import { Output } from '../Output';
import { executeCommand, tryExecuteCommand } from './command';
import { CommandContext, setCommandContext } from './commandContext';
import Timeout = NodeJS.Timeout;

let timeoutID: NodeJS.Timeout;

export namespace required {
  export interface IRequiredVersion {
    app: string;
    isValid: boolean;
    version: string;
    requiredVersion: string | { min: string, max: string };
  }

  const currentState: {[key: string]: IRequiredVersion} = {};
  const requiredApps = [ 'node', 'npm', 'git' ];
  // const auxiliaryApps = [ 'python', 'truffle', 'ganache' ];

  export function isValid(version: string, minVersion: string, maxVersion?: string): boolean {
    return !!semver.valid(version) &&
      semver.gte(version, minVersion) &&
      (maxVersion ? semver.lt(version, maxVersion) : true);
  }

  /**
   * Function check all apps:
   * Node.js, npm, git, truffle, ganache, python
   */
  export async function checkAllApps(): Promise<boolean> {
    const versions = await getAllVersions();
    const invalid = versions.some((version) => !version.isValid);

    if (invalid) {
      showRequiredAppsMessage();
      return false;
    }

    return true;
  }

  /**
   * Function check only required apps:
   * Node.js, npm, git
   */
  export async function checkRequiredApps(message?: string): Promise<boolean> {
    const versions = await getAllVersions();
    const invalid = versions
      .filter((version) => requiredApps.includes(version.app))
      .some((version) => !version.isValid);

    if (invalid) {
      showRequiredAppsMessage(message || Constants.errorMessageStrings.RequiredAppsAreNotInstalled);
      return false;
    }

    return true;
  }

  export async function getAllVersions(): Promise<IRequiredVersion[]> {
    Output.outputLine('', 'Get version for required apps');

    currentState.node = currentState.node ||
      await createRequiredVersion('node', getNodeVersion, CommandContext.NodeIsAvailable);
    currentState.npm = currentState.npm ||
      await createRequiredVersion('npm', getNpmVersion, CommandContext.NpmIsAvailable);
    currentState.git = currentState.git ||
      await createRequiredVersion('git', getGitVersion, CommandContext.GitIsAvailable);
    currentState.python = currentState.python ||
      await createRequiredVersion('python', getPythonVersion, CommandContext.PythonIsAvailable);
    currentState.truffle = currentState.truffle ||
      await createRequiredVersion('truffle', getTruffleVersion, CommandContext.TruffleIsAvailable);
    currentState.ganache = currentState.ganache ||
      await createRequiredVersion('ganache', getGanacheVersion, CommandContext.GanacheIsAvailable);

    return Object.values(currentState);
  }

  export function showRequiredAppsMessage(message?: string): void {
    commands.executeCommand('azureBlockchainService.showRequirementsPage');

    clearTimeout(timeoutID as Timeout);
    timeoutID = setTimeout(async () => {
      try {
        message = message || Constants.informationMessage.invalidRequiredVersion;

        window.showErrorMessage(`${message} ${Constants.informationMessage.seeDetailsRequirementsPage}`);
      } catch (e) {
        // ignore
      }
    }, 500);
  }

  export async function getNodeVersion(): Promise<string> {
    return getVersion('node', '--version', /v(\d+.\d+.\d+)/);
  }

  export async function getNpmVersion(): Promise<string> {
    return getVersion('npm', '--version', /(\d+.\d+.\d+)/);
  }

  export async function getGitVersion(): Promise<string> {
    return getVersion(Constants.gitCommand, '--version', / (\d+.\d+.\d+)/);
  }

  export async function getPythonVersion(): Promise<string> {
    return getVersion('python', '--version', / (\d+.\d+.\d+)/);
  }

  export async function getTruffleVersion(): Promise<string> {
    return getVersion('truffle', 'version', /(?<=Truffle v)(\d+.\d+.\d+)/);
  }

  export async function getGanacheVersion(): Promise<string> {
    return getVersion('ganache-cli', '--version', /v(\d+.\d+.\d+)/);
  }

  export async function installNpm(): Promise<void> {
    try {
      await installUsingNpm('npm', Constants.requiredVersions.npm);
    } catch (error) {
      // ignore
    }

    currentState.npm = await createRequiredVersion('npm', getNpmVersion, CommandContext.NpmIsAvailable);
  }

  export async function installTruffle(): Promise<void> {
    try {
      await installUsingNpm('truffle', Constants.requiredVersions.truffle);
    } catch (error) {
      // ignore
    }
    currentState.truffle = await createRequiredVersion('truffle', getTruffleVersion, CommandContext.TruffleIsAvailable);
  }

  export async function installGanache(): Promise<void> {
    try {
      await installUsingNpm('ganache-cli', Constants.requiredVersions.ganache);
    } catch (error) {
      // ignore
    }
    currentState.ganache = await createRequiredVersion('ganache', getGanacheVersion, CommandContext.GanacheIsAvailable);
  }

  async function createRequiredVersion(
    appName: string,
    versionFunc: () => Promise<string>,
    commandContext: CommandContext,
  ): Promise<IRequiredVersion> {
    const version = await versionFunc();
    const requiredVersion = Constants.requiredVersions[appName];
    const minRequiredVersion = typeof requiredVersion === 'string' ? requiredVersion : requiredVersion.min;
    const maxRequiredVersion = typeof requiredVersion === 'string' ? '' : requiredVersion.max;
    const isValidApp = isValid(version, minRequiredVersion, maxRequiredVersion);

    setCommandContext(commandContext, isValidApp);

    return {
      app: appName,
      isValid: isValidApp,
      requiredVersion,
      version,
    };
  }

  async function installUsingNpm(
    packageName: string,
    packageVersion: string | { min: string, max: string },
  ): Promise<void> {
    Output.show();
    const version = typeof packageVersion === 'string' ? packageVersion : packageVersion.min;
    const majorVersion = version.split('.')[0];
    await executeCommand(undefined, 'npm', 'i', '-g', ` ${packageName}@^${majorVersion}`);
  }

  async function getVersion(program: string, command: string, matcher: RegExp): Promise<string> {
    try {
      const result = await tryExecuteCommand(undefined, program, command);
      if (result.code === 0) {
        const output = result.cmdOutput || result.cmdOutputIncludingStderr;
        const truffleVersion = output.match(matcher);
        const version = semver.clean(truffleVersion ? truffleVersion[1] : '');

        return version || '';
      }
    } catch (error) {
      // ignore error
    }

    return '';
  }
}
