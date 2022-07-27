// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IAzExtOutputChannel} from '@microsoft/vscode-azext-utils';
import os from 'os';
import path from 'path';
import {ExtensionContext, extensions} from 'vscode';

const extensionId = 'trufflesuite-csi.truffle-vscode';
const packageJSON = extensions.getExtension(extensionId)!.packageJSON;

export enum RequiredApps {
  node = 'node',
  npm = 'npm',
  git = 'git',
  truffle = 'truffle',
  ganache = 'ganache',
  hdwalletProvider = '@truffle/hdwallet-provider',
  dashboard = 'dashboard',
}

export enum NotificationOptions {
  error = 'error',
  info = 'info',
  warning = 'warning',
}

export class Constants {
  public static temporaryDirectory = '';
  public static extensionName = packageJSON.name;
  public static extensionVersion = packageJSON.version;
  public static extensionKey = packageJSON.aiKey;

  public static outputChannel = {
    truffleForVSCode: 'Truffle for VSCode',
    executeCommand: 'Truffle: Execute command',
    ganacheCommands: 'Truffle: Ganache Server',
    genericCommands: 'Truffle: Generic Server',
    dashboardCommands: 'Truffle: Dashboard Server',
    requirements: 'Truffle: Requirements',
    telemetryClient: 'Truffle: Telemetry Client',
    treeManager: 'Truffle: Service Tree Manager',
  };

  public static truffleConfigRequireNames = {
    fs: 'fs',
    fsPackageName: 'fs',
    hdwalletProvider: 'HDWalletProvider',
  };

  public static truffleConfigDefaultDirectory = {
    build_directory: path.join('./', 'build'),
    contracts_build_directory: path.join('./', 'build', 'contracts'),
    contracts_directory: path.join('./', 'contracts'),
    migrations_directory: path.join('./', 'migrations'),
  };

  public static defaultTruffleBox = 'truffle-box/vscode-starter-box';
  public static defaultDebounceTimeout = 300;
  public static defaultInputNameInBdm = 'transaction-node';

  public static localhost = '127.0.0.1';
  public static localhostName = 'development';
  public static defaultLocalhostPort = 8545;
  public static defaultTruffleConfigFileName = 'truffle-config.js';

  public static ganacheRetryTimeout = 2000; // milliseconds
  public static ganacheRetryAttempts = 5;
  public static latestBlock = 'latest';

  public static dashboardPort = 24012;
  public static dashboardRetryTimeout = 2000; // milliseconds
  public static dashboardRetryAttempts = 5;

  public static fileExplorerConfig = {
    contractFolder: 'contracts',
    contextValue: {
      root: 'root',
      folder: 'folder',
      file: 'file',
    },
  };

  // Values are quite brittle and don't map directly to the requirements.html screen.
  public static requiredVersions: {[key: string]: string | {min: string; max: string}} = {
    [RequiredApps.ganache]: {
      max: '8.0.0',
      min: '6.0.0',
    },
    [RequiredApps.git]: '2.10.0',
    [RequiredApps.hdwalletProvider]: {
      max: '2.0.0',
      min: '1.0.17',
    },
    [RequiredApps.node]: {
      max: '17.0.0',
      min: '14.0.0',
    },
    [RequiredApps.npm]: {
      max: '9.0.0',
      min: '6.14.15',
    },
    [RequiredApps.truffle]: {
      max: '6.0.0',
      min: '5.0.0',
    },
    [RequiredApps.dashboard]: {
      max: '',
      min: '5.5.0',
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

  public static globalStateKeys = {
    truffleExtensionVersion: 'truffleExtensionVersion',
    infuraCredentialsCacheKey: 'InfuraCache',
    infuraExcludedProjectsListKey: 'InfuraExcludedProjects',
    isNotifiedAboutOZSdk: 'isNotifiedAboutOZSdk',
    mnemonicStorageKey: 'mnemonicStorage',
    serviceResourceKey: 'treeContent',
  };

  public static infuraFileResponse = {
    css: '',
    path: '',
  };

  public static webViewPages = {
    changelog: {
      changelogPath: '',
      path: '',
      showOnStartup: 'showOnStartupChangelog',
      title: 'Truffle for VSCode Changelog',
      viewType: 'changelog',
    },
    contractUI: {
      path: '',
      showOnStartup: 'showOnStartupContractUI',
      title: 'Smart Contract UI',
      viewType: 'contractUIPage',
    },
    requirements: {
      path: '',
      showOnStartup: 'showOnStartupRequirementsPage',
      title: 'Truffle for VSCode Requirements',
      viewType: 'requirementsPage',
    },
    welcome: {
      path: '',
      showOnStartup: 'showOnStartupWelcomePage',
      title: 'Welcome to Truffle',
      viewType: 'welcomePage',
    },
  };

  public static contractExtension = {
    json: '.json',
    sol: '.sol',
    txt: '.txt',
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
    deployedBytecode: 'deployedBytecode',
  };

  public static propertyLabels = {
    gasLimit: 'gas limit',
    gasPrice: 'gas price',
  };

  public static confirmationDialogResult = {
    no: 'No',
    yes: 'Yes',
  };

  public static installationDialogResult = {
    cancel: 'Cancel',
    install: 'Install',
  };

  public static mnemonicConstants = {
    fileExt: 'env',
  };

  public static defaultContractSettings = {
    gasLimit: 4712388,
    gasPrice: 100000000000,
  };

  public static paletteLabels = {
    enterApplicationName: 'Enter application name',
    enterBlockchainDataManagerName: 'Enter blockchain data manager name',
    enterConnectionName: 'Enter connection name',
    enterConsortiumManagementPassword: 'Enter consortium management password',
    enterConsortiumName: 'Enter consortium name',
    enterEventGridName: 'Enter event grid name',
    enterInfuraProjectName: 'Enter project name',
    enterLocalProjectName: 'Enter local project name',
    enterLocalProjectPort: 'Enter local port number',
    enterBlockNumber: 'Enter a block number',
    enterNetworkUrl: 'Enter a valid host address with no port',
    enterMemberName: 'Enter member name',
    enterMemberPassword: 'Enter member password',
    enterTransactionNodeName: 'Enter transaction node name',
    enterTransactionNodePassword: 'Enter transaction node password',
    enterTruffleBoxName: 'Enter pre-built Truffle project',
    enterUserEmail: 'Enter user email address',
    enterUserName: 'Enter user name',
    enterUserPassword: 'Enter user password',
    provideResourceGroupName: 'Provide a resource group name',
    selectConsortiumProtocol: 'Select protocol',
    selectConsortiumRegion: 'Select region',
    selectConsortiumSku: 'Select SKU',
    selectResourceGroup: 'Select resource group',
    valueOrDefault: Constants.getMessageValueOrDefault,
  };

  public static treeItemData = {
    dashboard: {
      contextValue: 'dashboard',
      iconPath: {dark: '', light: ''},
      label: 'Truffle Dashboard',
      prefix: 'dsh',
    },
    network: {
      default: {
        contextValue: 'network',
        iconPath: {dark: '', light: ''},
      },
      infura: {
        contextValue: 'network',
        iconPath: {dark: '', light: ''},
      },
      local: {
        contextValue: 'localnetwork',
        iconPath: {dark: '', light: ''},
      },
      generic: {
        contextValue: 'network',
        iconPath: {dark: '', light: ''},
      },
    },
    layer: {
      infura: {
        contextValue: 'layer',
        iconPath: {dark: '', light: ''},
        layerOne: {
          label: 'Layer One',
          value: 1,
        },
        layerTwo: {
          label: 'Layer Two',
          value: 2,
        },
      },
    },
    project: {
      default: {
        contextValue: 'project',
        iconPath: {dark: '', light: ''},
      },
      infura: {
        contextValue: 'project',
        iconPath: {dark: '', light: ''},
      },
      local: {
        contextValue: 'localproject',
        iconPath: {dark: '', light: ''},
      },
      generic: {
        contextValue: 'genericproject',
        iconPath: {dark: '', light: ''},
      },
    },
    service: {
      default: {
        contextValue: 'service',
        iconPath: {dark: '', light: ''},
        label: 'Default Service',
      },
      infura: {
        contextValue: 'service',
        iconPath: {dark: '', light: ''},
        label: 'Infura Service',
        prefix: 'inf',
      },
      local: {
        contextValue: 'service',
        iconPath: {dark: '', light: ''},
        label: 'Ganache Service',
        prefix: 'loc',
        type: {
          default: {
            label: 'Local',
            prefix: 'dfl',
            description: 'Local',
            isForked: false,
            networks: {},
          },
          forked: {
            label: 'Fork',
            prefix: 'frk',
            description: 'Fork',
            isForked: true,
            networks: {
              mainnet: 'Mainnet',
              ropsten: 'Ropsten',
              kovan: 'Kovan',
              rinkeby: 'Rinkeby',
              goerli: 'Goerli',
              other: 'Other...',
            },
          },
          linked: {
            label: 'Linked',
            prefix: 'lnk',
            description: 'Linked',
            isForked: false,
            networks: {},
          },
        },
      },
      generic: {
        contextValue: 'service',
        iconPath: {dark: '', light: ''},
        label: 'Other Service',
        prefix: 'gnr',
      },
    },
  };

  public static validationRegexps = {
    array: /^\[.*]$/g,
    forbiddenChars: {
      dotAtTheEnd: /^(?=.*[.]$).*$/g,
      networkName: /[^\da-z]/g,
      outboundConnectionName: /^(\d|[a-z])+$/g,
      password: /[#`*"'\-%;,]/g,
      resourceGroupName: /[#`*"'%;,!@$^&+=?/<>|[\]{}:\\~]/g,
    },
    hasDigits: /(?=.*\d)/g,
    infuraProjectname: /^([a-zA-Z]|\d|\s|[-_:]){3,}$/g,
    isJsonFile: new RegExp(Constants.contractExtension.json + '$'),
    isLowerCase: /^[a-z0-9_\-!@$^&()+=?/<>|[\]{}:.\\~ #`*"'%;,]+$/g,
    isUrl: /^(?:http(s)?:\/\/)?[\w:@.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+$/gim,
    lowerCaseLetter: /(?=.*[a-z]).*/g,
    moduleExportsTemplate: /{(.*)}$/g,
    onlyNumber: /^(-\d+|\d+)$/g,

    port: /^([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    types: {
      simpleArray: /\w+\[]/g,
      simpleMapping: /^\[.+]$/g,
      solidityAddress: /^(0x)[a-zA-Z0-9]{40}$/g,
      solidityInt: /^int\d+$/g,
      solidityInteger: /u*int\d*/g,
      solidityUint: /^uint\d+$/g,
    },
    upperCaseLetter: /(?=.*[A-Z]).*/g,
  };

  public static responseReason = {
    alreadyExists: 'AlreadyExists',
  };

  public static validationMessages = {
    arrayElementsShouldBeValid: (elementsType: string) => {
      return `Array elements should have valid value of type ${elementsType}`;
    },
    forbiddenChars: {
      dotAtTheEnd: "Input value must not have '.' at the end.",
      networkName: 'Invalid name. Name can contain only lowercase letters and numbers.',
      outboundConnectionName: 'Outbound connection must contain only lowercase letters and numbers.',
      password: "'#', '`', '*', '\"', ''', '-', '%', ',', ';'",

      resourceGroupName:
        "'#', '`', '*', '\"', ''', '%', ';', ',', '!', '@', '$', '^', '&', '+', '=', '?', '/', '<', '>', '|', '[', ']', '{', '}', ':', '\\', '~'",
    },
    forbiddenSymbols: 'Provided name has forbidden symbols.',
    infuraProjectInvalidName:
      'Project name must be at least 3 characters and should have alphanumeric, space, and the symbols "-", "_", ":".',
    invalidConfirmationResult: "'yes' or 'no'",
    invalidHostAddress: 'Invalid host address',
    invalidPort: 'Invalid port.',
    lengthRange: Constants.getMessageLengthRange,
    nameAlreadyInUse: 'This name is already in use. Choose another one.',
    noDigits: 'Password should have at least one digit.',
    noLowerCaseLetter: 'Password should have at least one lowercase letter from a to z.',
    noSpecialChars: 'Password must have 1 special character.',
    noUpperCaseLetter: 'Password should have at least one uppercase letter from A to Z.',
    onlyLowerCaseAllowed: 'Only lower case allowed.',
    onlyNumberAllowed: "Value after ':' should be a number.",
    portAlreadyInUse: 'This port is already in use. Choose another one.',
    portNotInUseGanache: 'No local ganache service running on port. Please start service or select another port.',
    portNotInUseGeneric: 'No local service running on port. Please start service or select another port.',
    projectAlreadyExists: 'Network already exists.',
    projectAlreadyExistsOnInfura: 'Project already exist with the same name on Infura.',
    projectIdAlreadyExists: 'Network with project ID already exists.',
    transactionNodeNameAlreadyExists: 'Transaction Node name already exists.',
    unresolvedSymbols: Constants.getMessageInputHasUnresolvedSymbols,
    valueCanSafelyStoreUpToBits: (pow: string) => {
      return `Value can only safely store up to ${pow} bits`;
    },
    valueCannotBeEmpty: 'Value cannot be empty.',
    valueShouldBeArray: 'Value should be the array and enclosed in [ ]',
    valueShouldBeBool: 'Value should be true or false.',
    valueShouldBeNumber: 'Value should be a number.',
    valueShouldBeNumberOrEmpty: 'Value should be a number or empty.',
    valueShouldBePositiveAndCanSafelyStoreUpToBits: (pow: string) => {
      return `Value should be positive and can only safely store up to ${pow} bits`;
    },
    valueShouldBeSolidityAddress: 'Value should be the correct solidity address.',
  };

  public static placeholders = {
    confirmDialog: 'Are your sure?',
    confirmPaidOperation: "This operation will cost Ether, type 'yes' to continue",
    emptyLineText: '<empty line>',
    generateMnemonic: 'Generate mnemonic',
    pasteMnemonic: 'Paste mnemonic',
    selectContract: 'Select contract',
    selectDeployDestination: 'Select deploy destination',
    selectDestination: 'Select destination',
    selectGanacheServer: 'Select Ganache server',
    selectInfuraProject: 'Select Infura project',
    selectInfuraProjectAvailability: 'Select Infura project availability',
    selectMember: 'Select member',
    selectMnemonicExtractKey: 'Select mnemonic to extract key',
    selectMnemonicStorage: 'Select mnemonic storage',
    selectType: 'Select a type',
    selectNetwork: 'Select a network to fork',
    selectNewProjectPath: 'Select new project path',
    selectProjects: 'Select Projects',
    selectTransactionNode: 'Select transaction node',
    selectTypeOfSolidityProject: 'Select type of solidity project',
    setupMnemonic: 'Setup mnemonic',
    enterBlockNumber: 'Leave blank for latest block',
    enterNetworkUrl: 'Enter a valid url',
    buttonTruffleUpdate: 'Update Truffle',
    buttonClose: 'Close',
  };

  // More information see here
  // https://ethereum.stackexchange.com/questions/17051/how-to-select-a-network-id-or-is-there-a-list-of-network-ids
  public static infuraEndpointsIds: {[key: string]: number} = {
    goerli: 5,
    kovan: 42,
    mainnet: 1,
    rinkeby: 4,
    ropsten: 3,
    'arbitrum-mainnet': 42161,
    'arbitrum-rinkeby': 421611,
    'aurora-mainnet': 1313161554,
    'aurora-testnet': 1313161555,
    'near-mainnet': 0,
    'near-testnet': 0,
    'optimism-kovan': 69,
    'optimism-mainnet': 10,
    'polygon-mainnet': 137,
    'polygon-mumbai': 80001,
  };

  public static projectAvailability = {
    private: 'Private',
    public: 'Public',
  };

  public static executeCommandMessage = {
    failedToRunCommand: (command: string) => `Failed to run command - ${command}. More details in output`,
    failedToRunScript: (scriptPath: string) => `Failed to run script - ${scriptPath}. More details in output`,
    finishRunningCommand: 'Finished running command',
    forkingModule: 'Forking script',
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
    creatingProject: 'Creating new project',
    deployingContracts: (destination: string) => {
      return `Deploying contracts to '${destination}'`;
    },
  };

  public static rpcMethods = {
    getCode: 'eth_getCode',
    netListening: 'net_listening',
    netVersion: 'net_version',
    web3_clientVersion: 'web3_clientVersion',
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

  public static genericCommandStrings = {
    invalidPort: 'Unable to verify connection. Invalid port',
    portIsBusy: 'Cannot start ganache server, port is busy',
    serverNoAvailable: 'No network settings available',
    serverRunning: 'Server is running',
    serverNotFound: 'Not found',
  };

  public static dashboardCommandStrings = {
    cannotStartServer: 'Cannot start dashboard server',
    invalidDashboardPort: 'Cannot start Dashboard server. Invalid port',
    dashboardPortIsBusy: 'Cannot start dashboard server, port is busy',
    serverAlreadyRunning: 'Dashboard server already running',
    serverSuccessfullyStarted: 'Dashboard server successfully started',
    serverSuccessfullyStopped: 'Dashboard server successfully stopped',
    serverCanNotStop: 'Dashboard stop server was failed because is not dashboard application',
    connectingDashboardServer: 'Connecting to Dashboard server',
  };

  public static uiCommandStrings = {
    createInfuraProject: '$(plus) Create Infura Project',
    createProject: '$(plus) Create a new network',
    createProjectDetail: 'Create a new network choosing Ganache, Infura and others',
    createTransactionNode: '$(plus) Create Transaction Node',
    deployViaTruffleDashboard: '$(arrow-up) Deploy via Truffle Dashboard',
    deployViaTruffleDashboardDetail: 'Deploy your contracts via Truffle Dashboard',
  };

  public static uiCommandSeparators = {
    optionSeparator: 'Options',
    networkSeparator: 'Networks',
  };

  public static errorMessageStrings = {
    // TODO names to lower case
    ActionAborted: 'Action aborted',
    AstIsEmpty: 'enums could not be extracted, current AST is empty',
    BlockchainItemIsUnavailable: Constants.getNetworkIsNotAvailableMessage,
    BuildContractsBeforeGenerating: 'Please build contracts before generating',
    BuildContractsDirDoesNotExist: Constants.getMessageContractsBuildDirectoryDoesNotExist,
    BuildContractsDirIsEmpty: Constants.getMessageContractsBuildDirectoryIsEmpty,
    CompiledContractIsMissing: 'Compiled contract is missing for solidity file.',
    ContractNotDeployed: 'Contracts are not deployed. Please deploy first.',
    DirectoryIsNotEmpty: 'Directory is not empty. Open another one?',
    ErrorWhileExecutingCommand: 'Error while executing command: ',
    ExtensionNotInstalled: (extensionName: string) =>
      `Please install ${extensionName} extension or change user settings to use another extension`,
    FetchingDeployedBytecodeIsFailed: 'An error occurred while fetching bytecode from network',
    GetMessageChildAlreadyConnected: Constants.getMessageChildAlreadyConnected,
    GitIsNotInstalled: 'Git is not installed',
    IncorrectInputUrl: 'Incorrect input url',
    InfuraUnauthorized: 'Unauthorized: please sign in with Infura account.',
    InvalidContract: 'This file is not a valid contract.',
    InvalidMnemonic: 'Invalid mnemonic',
    LoadServiceTreeFailed: 'Load service tree has failed.',
    MnemonicFileHaveNoText: 'Mnemonic file have no text',
    NetworkAlreadyExist: Constants.getMessageNetworkAlreadyExist,
    NetworkIsNotAvailable: 'The network the contract is deployed to is not available. Please deploy again.',
    NetworkNotFound: Constants.getMessageNetworkNotFound,
    NewProjectCreationFailed: 'Command createProject has failed.',
    NoContractBody: 'No contract body in AST',
    PleaseRenameOldStyleTruffleConfig: 'Please rename file "truffle.js" to "truffle-config.js"',
    RequiredAppsAreNotInstalled: 'To run command you should install required apps',
    SolidityContractsNotFound: 'Solidity contracts were not found',
    SubscriptionNotFound: 'Can not find available subscription.',
    ThereAreNoMnemonics: 'There are no mnemonics',
    TruffleConfigHasIncorrectFormat: '"truffle-config.js" has incorrect format',
    TruffleConfigIsNotExist: 'Truffle configuration file not found',
    VariableShouldBeDefined: Constants.getMessageVariableShouldBeDefined,
    WorkspaceShouldBeOpened: 'Workspace should be opened',
    DashboardVersionError: 'Please upgrade to the latest version of Truffle to use this feature',
  };

  public static informationMessage = {
    cancelButton: 'Cancel',
    compileAndDeployButton: 'Compile and deploy',
    contractNotDeployed: 'Contract not deployed yet.',
    deployButton: 'Deploy',
    deployFailed: 'Deploy failed',
    deploySucceeded: 'Deploy succeeded',
    detailsButton: 'Details',
    infuraAccountSuccessfullyCreated:
      'Your Infura account successfully created. Please check you email for complete registration',
    infuraSignInPrompt: 'Not signed in to Infura account, sign in first.',
    installButton: 'Install',
    invalidRequiredVersion: 'Required app is not installed or has an old version.',
    memberNameValidating: 'Member name validating...',
    networkIsNotReady: Constants.getNetworkIsNotReadyMessage,
    openButton: 'Open',
    privateKeyWasCopiedToClipboard: 'Private key was copied to clipboard',
    requiresDependency: 'This project deployment requires the @truffle/hdwallet-provider.',
    rpcEndpointCopiedToClipboard: 'RPCEndpointAddress copied to clipboard',
    seeDetailsRequirementsPage: 'Please see details on the Requirements Page',
    signInButton: 'Sign In',
    transactionBytecodeWasCopiedToClipboard: 'Transaction Bytecode was copied to clipboard',
    transactionNodeNameValidating: 'Transaction Node name validating...',
    unsupportedVersionOfExternalExtension: (name: string, currentVersion: string, supportedVersion: string) =>
      `You try to use "${name}" extension of version ${currentVersion}, but current supported vesrion is ${supportedVersion}.`,
  };

  public static infuraCredentials = {
    clientId: 'vs-code',
    clientSecret: 'pRo64S3izL72crOsuZ9PatRad0og5dlB',
    scopes: {
      offline: 'offline',
      projectRead: 'projects.read',
      projectWrite: 'projects.write',
      userRead: 'user.read',
    },
  };

  public static infuraAuthUrls = {
    authURL: 'oauth2/auth',
    baseURL: 'https://oauth.infura.io/',
    callbackURL: 'http://127.0.0.1:9010/callback',
    revoke: 'oauth2/revoke',
    tokenURL: 'oauth2/token',
  };

  public static infuraAPIUrls = {
    projects: 'eth/projects',
    rootURL: 'https://system.infura.io/',
    userMe: 'user/me',
  };

  public static infuraSigningIn = 'Signing in';

  public static infuraRequestGrantType = {
    authorizationCode: 'authorization_code',
    refreshToken: 'refresh_token',
  };

  public static solidityTypes = {
    address: 'address',
    bool: 'bool',
    int: 'int',
    string: 'string',
    uint: 'uint',
  };
  public static userSettings = {
    coreSdkSettingsKey: 'truffle-vscode.coreSDK',
    storageAccountUserSettingsKey: 'truffle-vscode.storageAccount.name',
  };

  public static coreSdk = {
    truffle: 'Truffle',
  };

  public static initialize(context: ExtensionContext) {
    this.temporaryDirectory = context.storageUri ? context.storageUri.fsPath : os.tmpdir();
    this.webViewPages.contractUI.path = context.asAbsolutePath(path.join('resources', 'drizzle', 'index.html'));
    this.webViewPages.welcome.path = context.asAbsolutePath(path.join('resources', 'welcome', 'index.html'));
    this.webViewPages.requirements.path = context.asAbsolutePath(path.join('resources', 'welcome', 'prereqs.html'));
    this.webViewPages.changelog.path = context.asAbsolutePath(path.join('resources', 'welcome', 'changelog.html'));
    this.webViewPages.changelog.changelogPath = context.asAbsolutePath(path.join('CHANGELOG.md'));
    this.infuraFileResponse.path = context.asAbsolutePath(path.join('resources', 'codeFlowResult', 'index.html'));
    this.infuraFileResponse.css = context.asAbsolutePath(path.join('resources', 'codeFlowResult', 'main.css'));

    this.treeItemData.network.default.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'EthereumNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'EthereumNetwork.svg')),
    };

    this.treeItemData.network.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'EthereumNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'EthereumNetwork.svg')),
    };

    this.treeItemData.network.local.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalNetwork.svg')),
    };

    this.treeItemData.network.generic.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalNetwork.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalNetwork.svg')),
    };

    this.treeItemData.project.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'InfuraProject.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'InfuraProject.svg')),
    };

    this.treeItemData.project.local.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalProject.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalProject.svg')),
    };

    this.treeItemData.project.generic.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalProject.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalProject.svg')),
    };

    this.treeItemData.service.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'InfuraService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'InfuraService.svg')),
    };

    this.treeItemData.service.local.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'LocalService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'LocalService.svg')),
    };

    this.treeItemData.layer.infura.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'InfuraLayer.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'InfuraLayer.svg')),
    };

    this.treeItemData.service.generic.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'GenericService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'GenericService.svg')),
    };

    this.treeItemData.dashboard.iconPath = {
      dark: context.asAbsolutePath(path.join('resources/dark', 'DashboardService.svg')),
      light: context.asAbsolutePath(path.join('resources/light', 'DashboardService.svg')),
    };
  }

  public static getTransactionNodeName(memberName: string, transactionNodeName: string): string {
    return memberName === transactionNodeName ? Constants.defaultInputNameInBdm : transactionNodeName;
  }

  private static getMessageChildAlreadyConnected(consortium: string): string {
    return `Connection to '${consortium}' already exists`;
  }

  private static getMessageValueOrDefault(valueName: string, defaultValue: any): string {
    return `Enter ${valueName}. Default value is ` + `${defaultValue}. ` + 'Press Enter for default.';
  }

  private static getMessageContractsBuildDirectoryIsEmpty(buildDirPath: string): string {
    return `Contracts build directory "${buildDirPath}" is empty.`;
  }

  private static getMessageContractsBuildDirectoryDoesNotExist(buildDirPath: string): string {
    return `Contracts build directory "${buildDirPath}" does not exist.`;
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

  private static getMessageInputHasUnresolvedSymbols(unresolvedSymbols: string): string {
    return `Input value must not have '${unresolvedSymbols}'.`;
  }

  private static getNetworkIsNotReadyMessage(itemType: string) {
    switch (itemType) {
      default:
        return 'Blockchain item is not ready yet. Please wait.';
    }
  }

  private static getNetworkIsNotAvailableMessage(itemType: string) {
    switch (itemType) {
      default:
        return 'Blockchain item is unavailable.';
    }
  }

  public static workspaceIgnoredFolders: string[] = [
    '**/node_modules/**',
    '**/.git/**',
    '**/ElectronClient/lib/**',
    '**/CliClient/build/lib/**',
    '**/CliClient/tests-build/lib/**',
    '**/ElectronClient/dist/**',
    '**/Modules/TinyMCE/JoplinLists/**',
    '**/Modules/TinyMCE/IconPack/**',
  ];
}

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
  export const prefix = 'truffle-vscode';
  export let context: ExtensionContext;
  export let outputChannel: IAzExtOutputChannel;
}

export enum ChainId {
  ETHEREUM = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  MATIC = 137,
  MATIC_TESTNET = 80001,
  FANTOM = 250,
  FANTOM_TESTNET = 4002,
  XDAI = 100,
  BSC = 56,
  BSC_TESTNET = 97,
  ARBITRUM = 42161,
  ARBITRUM_TESTNET = 79377087078960,
  MOONBEAM_TESTNET = 1287,
  AVALANCHE = 43114,
  AVALANCHE_TESTNET = 43113,
  HECO = 128,
  HECO_TESTNET = 256,
  HARMONY = 1666600000,
  HARMONY_TESTNET = 1666700000,
  OKEX = 66,
  OKEX_TESTNET = 65,
  CELO = 42220,
  PALM = 11297108109,
  PALM_TESTNET = 11297108099,
  MOONRIVER = 1285,
  FUSE = 122,
  TELOS = 40,
  HARDHAT = 31337,
  MOONBEAM = 1284,
  TRUFFLE = 1337,
  KILN = 1337802,
}
