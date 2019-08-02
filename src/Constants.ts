// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as os from 'os';
import * as path from 'path';
import { ExtensionContext, extensions } from 'vscode';

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
    consortiumTreeManager: 'Consortium Tree Manager',
    executeCommand: 'Execute command',
    ganacheCommands: 'Ganache Server',
    logicAppGenerator: 'Logic App Generator',
    requirements: 'Requirements',
    telemetryClient: 'Telemetry Client',
  };

  public static defaultTruffleBox = 'Azure-Samples/Blockchain-Ethereum-Template';
  public static defaultDebounceTimeout = 300;

  public static localhost = '127.0.0.1';
  public static localhostName = 'localhost';
  public static defaultLocalhostPort = 8545;
  public static defaultAzureBSPort = 3200;

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

  public static consortiumTreeResourceKey = 'treeContent';

  public static networkName = {
    azure: 'Azure Blockchain Service',
    local: 'Local Network',
    mainnet: 'Ethereum Network',
    testnet: 'Ethereum Testnet',
  };

  public static paletteABSLabels = {
    enterABSUrl: 'Enter Azure Blockchain Service url',
    enterAccessKey: 'Enter access key',
    enterAccountPassword: 'Enter accounts password',
    enterAccountsNumber: 'Enter accounts number',
    enterConsortiumManagementPassword: 'Enter consortium management password',
    enterConsortiumName: 'Enter consortium name',
    enterEtherAmount: 'Enter amount of ether to assign each test account',
    enterLocalNetworkLocation: 'Enter local port number',
    enterMemberName: 'Enter member name',
    enterMemberPassword: 'Enter member password',
    enterMnemonic: 'Enter mnemonic',
    enterNetworkLocation: 'Enter network location',
    enterPort: 'Enter port',
    enterProjectName: 'Enter project name',
    enterPublicNetworkUrl: 'Enter public network url',
    enterPublicTestnetUrl: 'Enter public testnet url',
    enterTruffleBoxName: 'Enter pre-built Truffle project',
    enterYourGanacheUrl: 'Enter your Ganache url',
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
    specialCharsConsortiumMemberName: /^(?=^[a-z])[a-z0-9]+$/g,
    specialCharsPassword: /[!@$^&()+=?\/<>|[\]{}_:.\\~]/g,
    specialCharsResourceGroup: /[-\w.()]/g,
    upperCaseLetter: /(?=.*[A-Z]).*/g,
  };

  public static responseReason = {
    alreadyExists: 'AlreadyExists',
  };

  public static validationMessages = {
    forbiddenChars: {
      dotAtTheEnd: "Input value must not have '.' at the end.",
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
    networkAlreadyExists: 'Network already exists.',
    noDigits: 'Password should have at least one digit.',
    noLowerCaseLetter: 'Password should have at least one lowercase letter from a to z.',
    noSpecialChars: 'Password must have 1 special character.',
    noUpperCaseLetter: 'Password should have at least one uppercase letter from A to Z.',
    onlyLowerCaseAllowed: 'Only lower case allowed.',
    onlyNumberAllowed: 'Value after \':\' should be a number.',
    portAlreadyInUse: 'This port is already in use. Choose another one.',
    resourceGroupAlreadyExists: Constants.getMessageResourceGroupAlreadyExist,
    unresolvedSymbols: Constants.getMessageInputHasUnresolvedSymbols,
    valueCannotBeEmpty: 'Value cannot be empty.',
    valueShouldBeNumberOrEmpty: 'Value should be a number or empty.',
  };

  public static placeholders = {
    confirmPaidOperation: 'This operation will cost Ether, type \'yes\' to continue',
    deployedUrlStructure: 'host:port',
    emptyLineText: '<empty line>',
    generateMnemonic: 'Generate mnemonic',
    pasteMnemonic: 'Paste mnemonic',
    resourceGroupName: 'Resource Group Name',
    selectConsortium: 'Select consortium',
    selectDeployDestination: 'Select deploy destination',
    selectDestination: 'Select destination',
    selectGanacheServer: 'Select Ganache server',
    selectMnemonicExtractKey: 'Select mnemonic to extract key',
    selectMnemonicStorage: 'Select mnemonic storage',
    selectNewProjectPath: 'Select new project path',
    selectResourceGroup: 'Select a resource group',
    selectRgLocation: 'Select a location to create your Resource Group in...',
    selectSubscription: 'Select subscription',
    selectTypeOfMnemonic: 'Select type of mnemonic',
    selectTypeOfSolidityProject: 'Select type of solidity project',
    setupMnemonic: 'Setup mnemonic',
  };

  public static icons = {
    blockchainService: { light: '', dark: '' },
    consortium: { light: '', dark: '' },
    member: { light: '', dark: '' },
    transactionNode: { light: '', dark: '' },
  };

  public static contextValue = {
    blockchainService: 'network',
    consortium: 'consortium',
    localConsortium: 'localconsortium',
    member: 'member',
    transactionNode: 'transactionNode',
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
    invalidGanachePort: 'Couldn\'t start Ganache server. Invalid port',
    serverAlreadyRunning: 'Ganache server already running',
    serverCanNotRunWithoutGanache: 'To start a local server, installed ganache-cli is required',
    serverCanNotStop: 'Ganache stop server was failed because is not ganache application',
    serverNoGanacheAvailable: 'No Ganache network settings available',
    serverNoGanacheInstance: 'No Ganache instance running',
    serverSuccessfullyStarted: 'Ganache server successfully started',
    serverSuccessfullyStopped: 'Ganache server successfully stopped',
  };

  public static uiCommandStrings = {
    ConnectConsortiumAzureBlockchainService: 'Connect to Azure Blockchain Service consortium',
    ConnectConsortiumLocalGanache: 'Connect to Local Ganache network',
    ConnectConsortiumPublicEthereum: 'Connect to Public Ethereum network',
    ConnectConsortiumTestEthereum: 'Connect to Test Ethereum network',
    CreateConsortiumAzureBlockchainService: 'Create Azure Blockchain Service consortium',
    CreateConsortiumLocally: 'Create local Ganache consortium',
    CreateNewNetwork: '$(plus) Create new network',
    DeployToConsortium: 'Deploy to consortium',
  };

  public static errorMessageStrings = {
    // TODO names to lower case
    ActionAborted: 'Action aborted',
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
    LoadConsortiumTreeFailed: 'Load consortium tree has failed.',
    MnemonicFileHaveNoText: 'Mnemonic file have no text',
    NetworkAlreadyExist: Constants.getMessageNetworkAlreadyExist,
    NetworkNotFound: Constants.getMessageNetworkNotFound,
    NewProjectCreationFailed: 'Command createProject has failed.',
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
    cancelButton: 'Cancel',
    consortiumDoesNotHaveMemberWithUrl: 'Consortium does not have member with url',
    consortiumNameValidating: 'Consortium name validating...',
    contractNotDeployed: 'Contract not deployed yet.',
    deployButton: 'Deploy',
    detailsButton: 'Details',
    generatedLogicApp: 'Generated the logic app!',
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

  public static initialize(context: ExtensionContext) {
    this.extensionContext = context;
    this.temporaryDirectory = context.storagePath ? context.storagePath : os.tmpdir();
    this.webViewPages.contractUI.path = context.asAbsolutePath(path.join('resources', 'drizzle', 'index.html'));
    this.webViewPages.welcome.path = context.asAbsolutePath(path.join('resources', 'welcome', 'index.html'));
    this.webViewPages.requirements.path = context.asAbsolutePath(path.join('resources', 'welcome', 'prereqs.html'));

    this.icons.blockchainService = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'blockchainService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'blockchainService.svg')),
    };
    this.icons.consortium = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'consortium.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'consortium.svg')),
    };
    this.icons.member = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'member.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'member.svg')),
    };
    this.icons.transactionNode = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'transactionNode.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'transactionNode.svg')),
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
}
