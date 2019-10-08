// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as os from 'os';
import * as path from 'path';
import { ExtensionContext, extensions } from 'vscode';
import { IOZAsset } from './services';

const extensionId = 'AzBlockchain.azure-blockchain';
const packageJSON = extensions.getExtension(extensionId)!.packageJSON;

export enum RequiredApps {
  node = 'node',
  npm = 'npm',
  git = 'git',
  python = 'python',
  truffle = 'truffle',
  ganache = 'ganache-cli',
  hdwalletProvider = 'truffle-hdwallet-provider',
}

export class Constants {
  public static extensionContext: ExtensionContext;
  public static temporaryDirectory = '';

  public static extensionName = packageJSON.name;
  public static extensionVersion = packageJSON.version;
  public static extensionKey = packageJSON.aiKey;

  public static outputChannel = {
    azureBlockchain: 'Azure Blockchain',
    azureBlockchainServiceClient: 'Azure Blockchain Service Client',
    executeCommand: 'Execute command',
    ganacheCommands: 'Ganache Server',
    logicAppGenerator: 'Logic App Generator',
    requirements: 'Requirements',
    telemetryClient: 'Telemetry Client',
    treeManager: 'Service Tree Manager',
  };

  public static defaultTruffleBox = 'Azure-Samples/Blockchain-Ethereum-Template';
  public static defaultDebounceTimeout = 300;

  public static infuraHost = 'infura.io';
  public static localhost = '127.0.0.1';
  public static localhostName = 'development';
  public static defaultLocalhostPort = 8545;
  public static defaultABSPort = 3200;
  public static defaultABSHost = 'blockchain.azure.com';

  public static ganacheRetryTimeout = 2000; // milliseconds
  public static ganacheRetryAttempts = 5;

  public static minPasswordLength = 12;
  public static maxPasswordLength = 72;
  public static minResourceGroupLength = 1;
  public static maxResourceGroupLength = 90;
  public static minConsortiumAndMemberLength = 2;
  public static maxConsortiumAndMemberLength = 20;

  public static requiredVersions: { [key: string]: string | { min: string, max: string } } = {
    [RequiredApps.ganache]: {
      max: '7.0.0',
      min: '6.0.0',
    },
    [RequiredApps.git]: '2.10.0',
    [RequiredApps.hdwalletProvider]: {
      max: '1.0.7',
      min: '1.0.6',
    },
    [RequiredApps.node]: '10.15.0',
    [RequiredApps.npm]: '6.4.1',
    [RequiredApps.python]: {
      max: '3.0.0',
      min: '2.7.15',
    },
    [RequiredApps.truffle]: {
      max: '6.0.0',
      min: '5.0.0',
    },
  };

  public static telemetryEvents = {
    extensionActivated: 'Extension.Activated',
    failedToCheckRequiredApps: 'Requirements.FailedToCheckRequiredApps',
    webPages: {
      action: 'WebPages.action',
      disposeWebPage: 'WebPages.DisposeWebPage',
      showWebPage: 'WebPages.ShowWebPage',
    },
  };

  public static webViewPages = {
    contractUI: {
      path: '',
      showOnStartup: 'showOnStartupContractUI',
      title: 'Smart Contract UI',
      viewType: 'contractUIPage',
    },
    requirements: {
      path: '',
      showOnStartup: 'showOnStartupRequirementsPage',
      title: 'Azure Blockchain Development Kit - Preview',
      viewType: 'requirementsPage',
    },
    welcome: {
      path: '',
      showOnStartup: 'showOnStartupWelcomePage',
      title: 'Welcome to Azure Blockchain',
      viewType: 'welcomePage',
    },
  };

  public static contractExtension = {
    json: '.json',
    sol: '.sol',
  };

  public static networkProtocols = {
    file: 'file://',
    ftp: 'ftp://',
    http: 'http://',
    https: 'https://',
  };

  public static contractProperties = {
    abi: 'abi',
    bytecode: 'bytecode',
  };

  public static propertyLabels = {
    gasLimit: 'gas limit',
    gasPrice: 'gas price',
  };

  public static confirmationDialogResult = {
    no: 'no',
    yes: 'yes',
  };

  public static mnemonicConstants = {
    fileExt: 'env',
    mnemonicStorage: 'mnemonicStorage',
  };

  public static defaultContractSettings = {
    gasLimit: 4712388,
    gasPrice: 100000000000,
  };

  public static serviceResourceKey = 'treeContent';

  public static paletteLabels = {
    enterConsortiumManagementPassword: 'Enter consortium management password',
    enterConsortiumName: 'Enter consortium name',
    enterInfuraProjectId: 'Enter project id',
    enterInfuraProjectName: 'Enter project name',
    enterLocalProjectName: 'Enter local project name',
    enterLocalProjectPort: 'Enter local port number',
    enterMemberName: 'Enter member name',
    enterMemberPassword: 'Enter member password',
    enterTruffleBoxName: 'Enter pre-built Truffle project',
    enterUserEmail: 'Enter user email address',
    enterUserName: 'Enter user name',
    enterUserPassword: 'Enter user password',
    provideResourceGroupName: 'Provide a resource group name',
    selectConsortiumProtocol: 'Select protocol',
    selectConsortiumRegion: 'Select region',
    selectConsortiumSku: 'Select SKU',
    selectResourceGroup: 'Select resource group',
    selectSubscription: 'Select subscription.',
    valueOrDefault: Constants.getMessageValueOrDefault,
  };

  public static validationRegexps = {
    forbiddenChars: {
      dotAtTheEnd: /^(?=.*[.]$).*$/g,
      networkName: /[^0-9a-z]/g,
      password: /[#`*"'\-%;,]/g,
      resourceGroupName: /[#`*"'%;,!@$^&+=?\/<>|[\]{}:\\~]/g,
    },
    hasDigits: /(?=.*\d)/g,
    isLowerCase: /^[a-z0-9_\-!@$^&()+=?\/<>|[\]{}:.\\~ #`*"'%;,]+$/g,
    isUrl: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+$/igm,
    lowerCaseLetter: /(?=.*[a-z]).*/g,
    // tslint:disable-next-line: max-line-length
    port: /^([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    specialChars: {
      consortiumMemberName: /^(?=^[a-z])[a-z0-9]+$/g,
      password: /[!@$^&()+=?\/<>|[\]{}_:.\\~]/g,
      resourceGroupName: /[-\w.()]/g,
    },
    upperCaseLetter: /(?=.*[A-Z]).*/g,
  };

  public static responseReason = {
    alreadyExists: 'AlreadyExists',
  };

  public static validationMessages = {
    forbiddenChars: {
      dotAtTheEnd: "Input value must not have '.' at the end.",
      networkName: 'Invalid name. Name can contain only lowercase letters and numbers.',
      password: "'#', '`', '*', '\"', ''', '-', '%', ',', ';'",
      // tslint:disable-next-line: max-line-length
      resourceGroupName: "'#', '`', '*', '\"', ''', '\%', ';', ',', '!', '@', '$', '^', '&', '+', '=', '?', '\/', '<', '>', '|', '[', '\]', '{', '}', ':', '\\', '~'",
    },
    forbiddenSymbols: 'Provided name has forbidden symbols.',
    invalidAzureName: 'Invalid name. Name can contain only lowercase letters and numbers. ' +
      `The first character must be a letter. Length must be between ${Constants.minConsortiumAndMemberLength} ` +
      `and ${Constants.maxConsortiumAndMemberLength} characters.`,
    invalidConfirmationResult: '\'yes\' or \'no\'',
    invalidHostAddress: 'Invalid host address',
    invalidPort: 'Invalid port.',
    invalidResourceGroupName: 'Resource group names only allow alphanumeric characters, periods,' +
      'underscores, hyphens and parenthesis and cannot end in a period. ' +
      `Length must be between ${Constants.minResourceGroupLength} and ${Constants.maxResourceGroupLength} characters.`,
    lengthRange: Constants.getMessageLengthRange,
    nameAlreadyInUse: 'This name is already in use. Choose another one.',
    noDigits: 'Password should have at least one digit.',
    noLowerCaseLetter: 'Password should have at least one lowercase letter from a to z.',
    noSpecialChars: 'Password must have 1 special character.',
    noUpperCaseLetter: 'Password should have at least one uppercase letter from A to Z.',
    onlyLowerCaseAllowed: 'Only lower case allowed.',
    onlyNumberAllowed: 'Value after \':\' should be a number.',
    openZeppelinFilesAreInvalid: Constants.getMessageOpenZeppelinFilesAreInvalid,
    portAlreadyInUse: 'This port is already in use. Choose another one.',
    portNotInUseGanache: 'No local service running on port. Please start service or select another port.',
    projectAlreadyExists: 'Network already exists.',
    projectIdAlreadyExists: 'Network with project ID already exists.',
    resourceGroupAlreadyExists: Constants.getMessageResourceGroupAlreadyExist,
    unresolvedSymbols: Constants.getMessageInputHasUnresolvedSymbols,
    valueCannotBeEmpty: 'Value cannot be empty.',
    valueShouldBeNumberOrEmpty: 'Value should be a number or empty.',
  };

  public static placeholders = {
    confirmDialog: 'Are your sure?',
    confirmPaidOperation: 'This operation will cost Ether, type \'yes\' to continue',
    emptyLineText: '<empty line>',
    generateMnemonic: 'Generate mnemonic',
    pasteMnemonic: 'Paste mnemonic',
    resourceGroupName: 'Resource Group Name',
    selectConsortium: 'Select consortium',
    selectDeployDestination: 'Select deploy destination',
    selectDestination: 'Select destination',
    selectGanacheServer: 'Select Ganache server',
    selectInfuraProject: 'Select Infura project',
    selectMnemonicExtractKey: 'Select mnemonic to extract key',
    selectMnemonicStorage: 'Select mnemonic storage',
    selectNewProjectPath: 'Select new project path',
    selectResourceGroup: 'Select a resource group',
    selectRgLocation: 'Select a location to create your Resource Group in...',
    selectSubscription: 'Select subscription',
    selectTypeOfSolidityProject: 'Select type of solidity project',
    setupMnemonic: 'Setup mnemonic',
  };

  public static treeItemData = {
    member: {
      default: {
        contextValue: 'member',
        iconPath: { dark: '', light: ''},
      },
    },
    network: {
      azure: {
        contextValue: 'network',
        iconPath: { dark: '', light: ''},
      },
      default: {
        contextValue: 'network',
        iconPath: { dark: '', light: ''},
      },
      infura: {
        contextValue: 'network',
        iconPath: { dark: '', light: ''},
      },
      local: {
        contextValue: 'localnetwork',
        iconPath: { dark: '', light: ''},
      },
    },
    project: {
      azure: {
        contextValue: 'project',
        iconPath: { dark: '', light: ''},
      },
      default: {
        contextValue: 'project',
        iconPath: { dark: '', light: ''},
      },
      infura: {
        contextValue: 'project',
        iconPath: { dark: '', light: ''},
      },
      local: {
        contextValue: 'localproject',
        iconPath: { dark: '', light: ''},
      },
    },
    service: {
      azure: {
        contextValue: 'service',
        iconPath: { dark: '', light: ''},
        label: 'Azure Blockchain Service',
      },
      default: {
        contextValue: 'service',
        iconPath: { dark: '', light: ''},
        label: 'Default Service',
      },
      infura: {
        contextValue: 'service',
        iconPath: { dark: '', light: ''},
        label: 'Infura Service',
      },
      local: {
        contextValue: 'service',
        iconPath: { dark: '', light: ''},
        label: 'Local Service',
      },
    },
  };

  // More information see here
  // https://ethereum.stackexchange.com/questions/17051/how-to-select-a-network-id-or-is-there-a-list-of-network-ids
  public static infuraEndpoints = {
    goerli: {
      id: 5,
      name: 'goerli',
    },
    kovan: {
      id: 42,
      name: 'kovan',
    },
    mainnet: {
      id: 1,
      name: 'mainnet',
    },
    rinkeby: {
      id: 4,
      name: 'rinkeby',
    },
    ropsten: {
      id: 3,
      name: 'ropsten',
    },
  };

  public static executeCommandMessage = {
    failedToRunCommand: Constants.getMessageFailedCommand,
    finishRunningCommand: 'Finished running command',
    runningCommand: 'Running command',
  };

  public static typeOfSolidityProject = {
    action: {
      emptyProject: 'createEmptyProject',
      projectFromTruffleBox: 'createProjectFromTruffleBox',
    },
    text: {
      emptyProject: 'Create basic project',
      projectFromTruffleBox: 'Create Project from Truffle box',
    },
  };

  public static statusBarMessages = {
    buildingContracts: 'Building contracts',
    checkingRequirementDependencies: 'Checking requirement dependencies version',
    creatingConsortium: 'Creating new consortium',
    creatingProject: 'Creating new project',
    deployingContracts: (destination: string) => {
      return `Deploying contracts to '${destination}'`;
    },
  };

  public static rpcMethods = {
    netListening: 'net_listening',
    netVersion: 'net_version',
  };

  public static ganacheCommandStrings = {
    cannotStartServer: 'Cannot start ganache server',
    ganachePortIsBusy: 'Cannot start ganache server, port is busy',
    invalidGanachePort: 'Cannot start Ganache server. Invalid port',
    serverAlreadyRunning: 'Ganache server already running',
    serverCanNotRunWithoutGanache: 'To start a local server, installed ganache-cli is required',
    serverCanNotStop: 'Ganache stop server was failed because is not ganache application',
    serverNoGanacheAvailable: 'No Ganache network settings available',
    serverNoGanacheInstance: 'No Ganache instance running',
    serverSuccessfullyStarted: 'Ganache server successfully started',
    serverSuccessfullyStopped: 'Ganache server successfully stopped',
  };

  public static uiCommandStrings = {
    azureBlockchainService: 'Azure Blockchain Service',
    createProject: '$(plus) Create a new network',
    deployToConsortium: 'Deploy to consortium',
    infuraService: 'Infura Service',
    localService: 'Local Service',
  };

  public static errorMessageStrings = {
    // TODO names to lower case
    ActionAborted: 'Action aborted',
    AstIsEmpty: 'enums could not be extracted, current AST is empty',
    BuildContractsBeforeGenerating: 'Please build contracts before generating',
    BuildContractsDirIsEmpty: Constants.getMessageContractsBuildDirectoryIsEmpty,
    BuildContractsDirIsNotExist: Constants.getMessageContractsBuildDirectoryIsNotExist,
    CompiledContractIsMissing: 'Compiled contract is missing for solidity file.',
    DirectoryIsNotEmpty: 'Directory is not empty. Open another one?',
    GetMessageChildAlreadyConnected: Constants.getMessageChildAlreadyConnected,
    GitIsNotInstalled: 'Git is not installed',
    InvalidContract: 'This file is not a valid contract.',
    InvalidMnemonic: 'Invalid mnemonic',
    InvalidServiceType: 'Invalid service type.',
    LoadServiceTreeFailed: 'Load service tree has failed.',
    MnemonicFileHaveNoText: 'Mnemonic file have no text',
    NetworkAlreadyExist: Constants.getMessageNetworkAlreadyExist,
    NetworkNotFound: Constants.getMessageNetworkNotFound,
    NewProjectCreationFailed: 'Command createProject has failed.',
    NoContractBody: 'No contract body in AST',
    NoSubscriptionFound: 'No subscription found.',
    NoSubscriptionFoundClick: 'No subscription found, click an Azure account ' +
      'at the bottom left corner and choose Select All',
    PleaseRenameOldStyleTruffleConfig: 'Please rename file "truffle.js" to "truffle-config.js"',
    RequiredAppsAreNotInstalled: 'To run command you should install required apps',
    ThereAreNoMnemonics: 'There are no mnemonics',
    TruffleConfigIsNotExist: 'Truffle configuration file not found',
    VariableShouldBeDefined: Constants.getMessageVariableShouldBeDefined,
    WaitForLogin: 'You should sign-in on Azure Portal',
    WorkflowTypeDoesNotMatch: 'workflowType does not match any available workflows',
    WorkspaceShouldBeOpened: 'Workspace should be opened',
  };

  public static informationMessage = {
    absItemNotReady: 'Azure Blockchain Service item is not ready yet. Please wait.',
    cancelButton: 'Cancel',
    consortiumDoesNotHaveMemberWithUrl: 'Consortium does not have member with url',
    consortiumNameValidating: 'Consortium name validating...',
    contractNotDeployed: 'Contract not deployed yet.',
    deployButton: 'Deploy',
    detailsButton: 'Details',
    generatedLogicApp: 'Generated the logic app!',
    infuraAccountSuccessfullyCreated: 'Your Infura account successfully created. Please check you email for complete registration',
    infuraSignIn: 'You are sign in to your Infura account.',
    infuraSignOut: 'You are sign out of your Infura account.',
    invalidRequiredVersion: 'Required app is not installed or has an old version.',
    memberNameValidating: 'Member name validating...',
    newProjectCreationFinished: 'New project was created successfully',
    newProjectCreationStarted: 'New project creation is started',
    openButton: 'Open',
    privateKeyWasCopiedToClipboard: 'Private key was copied to clipboard',
    rpcEndpointCopiedToClipboard: 'RPCEndpointAddress copied to clipboard',
    seeDetailsRequirementsPage: 'Please see details on the Requirements Page',
  };

  public static microservicesWorkflows = {
    Data: 'Data',
    Messaging: 'Messaging',
    Reporting: 'Reporting',
    Service: 'Service',
  };

  public static logicApp = {
    AzureFunction: 'Azure Function',
    FlowApp: 'Flow App',
    LogicApp: 'Logic App',
    output: {
      AzureFunction: 'generatedAzureFunction',
      FlowApp: 'generatedFlowApp',
      LogicApp: 'generatedLogicApp',
    },
  };

  public static azureResourceExplorer = {
    contentType: 'application/json',
    portalBasUri: 'https://portal.azure.com/#@microsoft.onmicrosoft.com',
    providerName: 'Microsoft.Blockchain',
    requestAcceptLanguage: 'en-US',
    requestApiVersion: '2018-06-01-preview',
    requestBaseUri: 'https://management.azure.com',
    resourceType: 'blockchainMembers',
  };

  public static openZeppelin = {
    cancelButtonTitle: 'Cancel',
    descriptionDownloadingFailed: 'Description downloading failed',
    downloadingContractsFromOpenZeppelin: 'Downloading contracts from OpenZeppelin',
    exploreDownloadedContractsInfo: 'Explore more information about the contracts downloaded',
    moreDetailsButtonTitle: 'More details',
    overwriteExistedContracts: 'Overwrite existed contracts',
    projectFileName: 'project.json',
    replaceButtonTitle: 'Replace',
    retryButtonTitle: 'Retry',
    retryDownloading: 'Retry downloading',
    selectCategoryForDownloading: 'Select category for downloading',
    skipButtonTitle: 'Skip files',
    hashCalculationFailed(errorMessage: string): string {
      return `Error while calculating file hash. Message: ${errorMessage}`;
    },
    wereNotDownloaded(count: number): string {
      return `OpenZeppelin: Some files (${count}) were not downloaded`;
    },
    wereDownloaded(count: number): string {
      return `OpenZeppelin: (${count}) files were stored`;
    },
    alreadyExisted(existing: IOZAsset[]): string {
      return `OpenZeppelin: (${existing.length}) files already exist on disk: `
          + existing.slice(0, 3).map((contract) => contract.name).join(' ')
          + (existing.length > 3 ? '...' : '');
    },
    invalidHashMessage(contractPath: string): string {
      return `${contractPath} - invalid hash`;
    },
    validHashMessage(contractPath: string): string {
      return `${contractPath} - valid hash`;
    },
    contractNotExistedOnDisk(contractPath: string): string {
      return `${contractPath} - not existed on disk`;
    },
    categoryWillDownloaded(categoryName: string): string {
      return `OpenZeppelin category will be downloaded: ${categoryName}`;
    },
    fileNow(count: number): string {
      return `${count} file(s) on OpenZeppelin library now`;
    },
  };

  public static initialize(context: ExtensionContext) {
    this.extensionContext = context;
    this.temporaryDirectory = context.storagePath ? context.storagePath : os.tmpdir();
    this.webViewPages.contractUI.path = context.asAbsolutePath(path.join('resources', 'drizzle', 'index.html'));
    this.webViewPages.welcome.path = context.asAbsolutePath(path.join('resources', 'welcome', 'index.html'));
    this.webViewPages.requirements.path = context.asAbsolutePath(path.join('resources', 'welcome', 'prereqs.html'));

    this.treeItemData.member.default.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'member.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'member.svg')),
    };

    this.treeItemData.network.default.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'EthereumNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'EthereumNetwork.svg')),
    };

    this.treeItemData.network.azure.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'ABNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'ABNetwork.svg')),
    };

    this.treeItemData.network.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'InfuraNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'InfuraNetwork.svg')),
    };

    this.treeItemData.network.local.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalNetwork.svg')),
    };

    this.treeItemData.project.azure.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'ABProject.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'ABProject.svg')),
    };

    this.treeItemData.project.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'InfuraProject.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'InfuraProject.svg')),
    };

    this.treeItemData.project.local.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalProject.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalProject.svg')),
    };

    this.treeItemData.service.azure.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'ABService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'ABService.svg')),
    };

    this.treeItemData.service.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'InfuraService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'InfuraService.svg')),
    };

    this.treeItemData.service.local.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalService.svg')),
    };
  }

  private static getMessageChildAlreadyConnected(consortium: string): string {
    return `Connection to '${consortium}' already exists`;
  }

  private static getMessageValueOrDefault(valueName: string, defaultValue: any): string {
    return `Enter ${valueName}. Default value is `
      + `${defaultValue}. `
      + 'Press Enter for default.';
  }

  private static getMessageResourceGroupAlreadyExist(resourceGroupName: string): string {
    return `A resource group with the same name: ${resourceGroupName} already exists. Please select other name`;
  }

  private static getMessageContractsBuildDirectoryIsEmpty(buildDirPath: string): string {
    return `Contracts build directory "${buildDirPath}" is empty.`;
  }

  private static getMessageContractsBuildDirectoryIsNotExist(buildDirPath: string): string {
    return `Contracts build directory "${buildDirPath}" is not exist.`;
  }

  private static getMessageNetworkAlreadyExist(networkName: string): string {
    return `Network with name "${networkName}" already existed in truffle-config.js`;
  }

  private static getMessageNetworkNotFound(networkName: string): string {
    return `Network with name "${networkName}" not found in truffle-config.js`;
  }

  private static getMessageVariableShouldBeDefined(variable: string): string {
    return `${variable} should be defined`;
  }

  private static getMessageLengthRange(min: number, max: number): string {
    return `Length must be between ${min} and ${max} characters`;
  }

  private static getMessageFailedCommand(command: string): string {
    return `Failed to run command - ${command}. More details in output`;
  }

  private static getMessageInputHasUnresolvedSymbols(unresolvedSymbols: string): string {
    return `Input value must not have '${unresolvedSymbols}'.`;
  }

  private static getMessageOpenZeppelinFilesAreInvalid(invalidFilePaths: string[]): string {
    return `OpenZeppelin files have been modified or removed:
      ${invalidFilePaths.join('; ')}. Please revert changes or download them again.`;
  }
}
