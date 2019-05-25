import * as semver from 'semver';
import { commands, window } from 'vscode';
import { Constants } from '../Constants';
import { Output } from '../Output';
import { executeCommand, tryExecuteCommand } from './command';
import { CommandContext, setCommandContext } from './commandContext';
import { getWorkspaceRoot } from './workspace';

export namespace required {
  export interface IRequiredVersion {
    app: string;
    isValid: boolean;
    version: string;
    requiredVersion: string | { min: string, max: string };
  }

  export enum Apps {
    node = 'node',
    npm = 'npm',
    git = 'git',
    python = 'python',
    truffle = 'truffle',
    ganache = 'ganache',
    hdwalletProvider = 'truffle-hdwallet-provider',
  }

  export enum Scope {
    locally = 1,
    global = 0,
  }

  const currentState: {[key: string]: IRequiredVersion} = {};

  const requiredApps = [ Apps.node, Apps.npm, Apps.git ];
  const auxiliaryApps = [ Apps.python, Apps.truffle, Apps.ganache, Apps.hdwalletProvider ];

  export function isValid(version: string, minVersion: string, maxVersion?: string): boolean {
    return !!semver.valid(version) &&
      semver.gte(version, minVersion) &&
      (maxVersion ? semver.lt(version, maxVersion) : true);
  }

  /**
   * Function check all apps: Node.js, npm, git, truffle, ganache, python
   * Show Requirements Page with checking showOnStartup flag
   */
  export async function checkAllApps(): Promise<boolean> {
    const valid = await checkAppsSilent(...requiredApps, ...auxiliaryApps);

    if (!valid) {
      const message = Constants.informationMessage.invalidRequiredVersion;
      const details = Constants.informationMessage.seeDetailsRequirementsPage;
      window
        .showErrorMessage(`${message}. ${details}`, Constants.informationMessage.detailsButton)
        .then((answer) => {
          if (answer) {
            commands.executeCommand('azureBlockchainService.showRequirementsPage');
          }
        });
      commands.executeCommand('azureBlockchainService.showRequirementsPage', true);
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

  export async function checkApps(...apps: Apps[]): Promise<boolean> {
    const valid = await checkAppsSilent(...apps);

    if (!valid) {
      const message = Constants.errorMessageStrings.RequiredAppsAreNotInstalled;
      const details = Constants.informationMessage.seeDetailsRequirementsPage;
      window.showErrorMessage(`${message}. ${details}`);
      commands.executeCommand('azureBlockchainService.showRequirementsPage');
    }

    return valid;
  }

  export async function checkAppsSilent(...apps: Apps[]): Promise<boolean> {
    const versions = await getAllVersions();
    const invalid = versions
      .filter((version) => apps.includes(version.app as Apps))
      .some((version) => !version.isValid);

    return !invalid;
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
    const majorVersion = (Constants.requiredVersions.truffle as { max: string, min: string }).min.split('.')[0];
    let localVersion;

    try {
      localVersion = (await executeCommand(getWorkspaceRoot(), `npm list --depth 0 truffle@${majorVersion}`))
        .match(/truffle@(\d+.\d+.\d+)/);
    } catch (e) {
      // ignore
    }

    return (localVersion && localVersion[1]) || getVersion('truffle', 'version', /(?<=Truffle v)(\d+.\d+.\d+)/);
  }

  export async function getGanacheVersion(): Promise<string> {
    const majorVersion = (Constants.requiredVersions.ganache as { max: string, min: string }).min.split('.')[0];
    let localVersion;

    try {
      localVersion = (await executeCommand(getWorkspaceRoot(), `npm list --depth 0 ganache-cli@${majorVersion}`))
        .match(/ganache-cli@(\d+.\d+.\d+)/);
    } catch (e) {
      console.log(e);
    }

    return (localVersion && localVersion[1]) || getVersion('ganache-cli', '--version', /v(\d+.\d+.\d+)/);
  }

  export async function installNpm(): Promise<void> {
    try {
      await installUsingNpm('npm', Constants.requiredVersions.npm);
    } catch (error) {
      // ignore
    }

    currentState.npm = await createRequiredVersion('npm', getNpmVersion, CommandContext.NpmIsAvailable);
  }

  export async function installTruffle(scope?: Scope): Promise<void> {
    try {
      await installUsingNpm('truffle', Constants.requiredVersions.truffle, scope);
    } catch (error) {
      // ignore
    }

    currentState.truffle = await createRequiredVersion('truffle', getTruffleVersion, CommandContext.TruffleIsAvailable);
  }

  export async function installGanache(scope?: Scope): Promise<void> {
    try {
      await installUsingNpm('ganache-cli', Constants.requiredVersions.ganache, scope);
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
    scope?: Scope,
  ): Promise<void> {
    Output.show();

    const versionString = typeof packageVersion === 'string' ?
    `^${packageVersion}` :
    `>=${packageVersion.min} <${packageVersion.max}`;

    await executeCommand(getWorkspaceRoot(), 'npm', 'i', scope ? '' : '-g', ` ${packageName}@"${versionString}"`);
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
