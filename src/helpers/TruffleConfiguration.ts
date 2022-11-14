// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {MnemonicRepository} from '@/services';
import {Telemetry} from '@/TelemetryClient';
import * as acorn from 'acorn';
import {Node} from 'acorn';
import * as walk from 'acorn-walk';
import {generate} from 'astring';
import {entropyToMnemonic} from 'bip39';
import crypto from 'crypto';
import ESTree from 'estree';
import fs from 'fs-extra';
import path from 'path';
import {Uri} from 'vscode';
import {ICommandResult, tryExecuteCommandInFork} from './command';
import {IConfiguration, INetwork, INetworkOption, IProvider, notAllowedSymbols} from './ConfigurationReader';
import {getPathByPlatform, getWorkspaceRoot} from './WorkspaceHelpers';

export class EvalTruffleConfigError extends Error {
  constructor(message: string, readonly reason: string) {
    super(message);
  }
}

//region Internal Functions
const isHdWalletProviderDeclaration = (nodeType: string, node: Node): boolean => {
  let xNode: ESTree.Node;

  if (nodeType === 'NewExpression') {
    xNode = node as unknown as ESTree.NewExpression;
    if (xNode.callee.type === 'Identifier') {
      return xNode.callee.name === Constants.truffleConfigRequireNames.hdwalletProvider;
    }
  }

  if (nodeType === 'VariablePattern') {
    xNode = node as unknown as ESTree.Identifier;
    return xNode.name === Constants.truffleConfigRequireNames.hdwalletProvider;
  }

  return false;
};

const isMnemonicNode = (node: ESTree.Literal | ESTree.NewExpression): boolean =>
  node && node.type === 'Literal' && typeof node.value === 'string';

const jsonToConfiguration = (truffleConfig: {[key: string]: any}): IConfiguration => {
  const {build_directory, contracts_directory, contracts_build_directory, migrations_directory} =
    Constants.truffleConfigDefaultDirectory;

  truffleConfig.build_directory = truffleConfig.build_directory || build_directory;
  truffleConfig.contracts_directory = truffleConfig.contracts_directory || contracts_directory;
  truffleConfig.contracts_build_directory = truffleConfig.contracts_build_directory || contracts_build_directory;
  truffleConfig.migrations_directory = truffleConfig.migrations_directory || migrations_directory;

  const arrayNetwork: INetwork[] = [];

  if (truffleConfig.networks) {
    // Networks are not used yet in the code
    Object.entries(truffleConfig.networks).forEach(([key, value]) => {
      arrayNetwork.push({
        name: key,
        options: value as INetworkOption,
      });
    });
  }

  truffleConfig.networks = arrayNetwork;
  // bit ganky...
  return truffleConfig as IConfiguration;
};

// refactor out the core parser between the two functions.
function parseTruffleConfig(result: ICommandResult, truffleConfigName: string) {
  const truffleConfigObject = result.messages!.find((message) => message.command === 'truffleConfig');

  if (!truffleConfigObject || !truffleConfigObject.message) {
    throw new EvalTruffleConfigError(`"${truffleConfigName}" has incorrect format`, result.cmdOutputIncludingStderr);
  }

  return JSON.parse(truffleConfigObject.message);
}

/**
 * This version uses the workspace root
 */
async function getTruffleMetadata(workingDirectory?: string, truffleConfigName?: string): Promise<IConfiguration> {
  const workspaceRoot = workingDirectory ?? getWorkspaceRoot()!;
  truffleConfigName = truffleConfigName ?? 'truffle-config.js';
  const truffleConfigTemplatePath = path.join(__dirname, 'checkTruffleConfigTemplate.js');
  const result = await tryExecuteCommandInFork(workspaceRoot, truffleConfigTemplatePath, truffleConfigName);
  return parseTruffleConfig(result, truffleConfigName);
}

const generateVariableDeclaration = (
  varName: string,
  loader: string,
  loaderArg: string
): ESTree.VariableDeclaration => ({
  declarations: [
    {
      id: {
        name: varName,
        type: 'Identifier',
      },
      init: {
        optional: false,
        arguments: [
          {
            raw: `'${loaderArg}'`,
            type: 'Literal',
            value: `${loaderArg}`,
          },
        ],
        callee: {
          name: loader,
          type: 'Identifier',
        },
        type: 'CallExpression',
      },
      type: 'VariableDeclarator',
    },
  ],
  kind: 'const',
  type: 'VariableDeclaration',
});

const isVarDeclaration =
  (varName: string): ((nodeType: string, node: Node) => boolean) =>
  (nodeType: string, node: Node) => {
    if (nodeType === 'VariableDeclaration') {
      const xNode = node as unknown as ESTree.VariableDeclaration;
      return (
        xNode.declarations[0].type === 'VariableDeclarator' &&
        (xNode.declarations[0].id as ESTree.Identifier).name === varName
      );
    }
    return false;
  };

const generateFsReadExpression = (operator: string, args: string): ESTree.CallExpression => ({
  optional: false,
  arguments: [
    {
      raw: `'${args}'`,
      type: 'Literal',
      value: `${args}`,
    },
    {
      raw: "'utf-8'",
      type: 'Literal',
      value: 'utf-8',
    },
  ],
  callee: {
    name: operator,
    type: 'Identifier',
  },
  type: 'CallExpression',
});

const generateProperty = (name: string, value: ESTree.Expression): ESTree.Property => {
  notAllowedSymbols.lastIndex = 0;
  const isLiteral = notAllowedSymbols.test(name);

  return {
    computed: false,
    key: isLiteral ? generateLiteral(name) : generateIdentifier(name),
    kind: 'init',
    method: false,
    shorthand: false,
    type: 'Property',
    value,
  };
};

const hdWalletProviderToAst = (provider: IProvider): ESTree.NewExpression => ({
  arguments: [
    generateFsReadExpression('fs.readFileSync', (provider.mnemonic || '').replace(/\\/g, '\\\\')),
    generateLiteral(provider.url || ''),
  ],
  callee: {
    name: Constants.truffleConfigRequireNames.hdwalletProvider,
    type: 'Identifier',
  },
  type: 'NewExpression',
});

const networkOptionsToAst = (network: INetwork): ESTree.ObjectExpression => {
  const obj: ESTree.ObjectExpression = {
    properties: [],
    type: 'ObjectExpression',
  };
  const options = network.options;

  if (options.network_id !== undefined) {
    obj.properties.push(generateProperty('network_id', generateLiteral(options.network_id)));
  }

  if (options.port !== undefined) {
    obj.properties.push(generateProperty('port', generateLiteral(options.port)));
  }

  if (options.host !== undefined) {
    obj.properties.push(generateProperty('host', generateLiteral(options.host)));
  }

  if (options.websockets !== undefined) {
    obj.properties.push(generateProperty('websockets', generateLiteral(options.websockets)));
  }

  if (options.gas !== undefined) {
    obj.properties.push(generateProperty('gas', generateLiteral(options.gas)));
  }

  if (options.gasPrice !== undefined) {
    obj.properties.push(generateProperty('gasPrice', generateLiteral(options.gasPrice)));
  }

  if (options.from !== undefined) {
    obj.properties.push(generateProperty('from', generateLiteral(options.from)));
  }

  if (options.skipDryRun !== undefined) {
    obj.properties.push(generateProperty('skipDryRun', generateLiteral(options.skipDryRun)));
  }

  if (options.timeoutBlocks !== undefined) {
    obj.properties.push(generateProperty('timeoutBlocks', generateLiteral(options.timeoutBlocks)));
  }

  if (options.provider !== undefined) {
    obj.properties.push(generateProperty('provider', hdWalletProviderToAst(options.provider)));
  }

  return obj;
};

const generateObjectExpression = (): ESTree.ObjectExpression => ({
  properties: [],
  type: 'ObjectExpression',
});

const generateIdentifier = (name: string): ESTree.Identifier => ({
  name,
  type: 'Identifier',
});

const generateLiteral = (value: string | number | boolean | null): ESTree.Literal => ({
  raw: JSON.stringify(value),
  type: 'Literal',
  value,
});

const findProperty = (node: ESTree.Node, propertyName: string): ESTree.Property | undefined => {
  if (node.type === 'ObjectExpression') {
    node = node as ESTree.ObjectExpression;
    let ret = undefined;
    node.properties.forEach((property) => {
      if (property.type === 'Property') {
        if (
          (property.key.type === 'Identifier' && property.key.name === propertyName) ||
          (property.key.type === 'Literal' && `${property.key.value}` === propertyName)
        ) {
          ret = property;
        }
      }
    });
    return ret;
  }
  return undefined;
};

const isModuleExportsExpression = (nodeType: string, node: Node): boolean => {
  if (nodeType !== 'ExpressionStatement') {
    return false;
  }

  const xNode = node as unknown as ESTree.ExpressionStatement;
  if (
    xNode.expression.type === 'AssignmentExpression' &&
    xNode.expression.left.type === 'MemberExpression' &&
    xNode.expression.left.object.type === 'Identifier' &&
    xNode.expression.left.object.name === 'module'
  ) {
    if (
      (xNode.expression.left.property.type === 'Identifier' && xNode.expression.left.property.name === 'exports') ||
      (xNode.expression.left.property.type === 'Literal' && xNode.expression.left.property.value === 'module')
    ) {
      return true;
    }
  }

  return false;
};

const getModuleExportsObjectExpression = (ast: Node): ESTree.ObjectExpression | void => {
  const moduleExports = walk.findNodeAt(ast, undefined, undefined, isModuleExportsExpression);
  if (moduleExports && moduleExports.node.type === 'ExpressionStatement') {
    const xNode = moduleExports.node as unknown as ESTree.ExpressionStatement;
    const rightExpression = (xNode.expression as ESTree.AssignmentExpression)?.right;
    if (rightExpression.type === 'ObjectExpression') {
      return rightExpression;
    }
  }
};

const isHDWalletProvider = (nodeType: string, node: Node): boolean => {
  if (nodeType === 'NewExpression') {
    const xNode = node as unknown as ESTree.NewExpression;
    return (
      xNode.callee.type === 'Identifier' && xNode.callee.name === Constants.truffleConfigRequireNames.hdwalletProvider
    );
  }
  return false;
};

const astToHDWalletProvider = (node: ESTree.NewExpression): IProvider => {
  const provider: IProvider = {
    raw: generate(node),
  };

  const mnemonicNode = node.arguments[0];
  // a lot of pulava for the mnemonic if you ask me... use truffle dashboard instead.
  if (mnemonicNode.type === 'Literal' && isMnemonicNode(mnemonicNode)) {
    provider.mnemonic = '' + mnemonicNode.value;
  } else if (mnemonicNode.type === 'NewExpression' || mnemonicNode.type === 'CallExpression') {
    const mnemonicFilePathNode: ESTree.Literal =
      mnemonicNode && mnemonicNode.arguments && (mnemonicNode.arguments[0] as ESTree.Literal);
    if (isMnemonicNode(mnemonicFilePathNode)) {
      provider.mnemonic = MnemonicRepository.getMnemonic(mnemonicFilePathNode.value as string);
    }
  }

  const urlNode = node.arguments[1];
  if (urlNode && urlNode.type === 'Literal') {
    provider.url = '' + urlNode.value;
  }

  if (urlNode && urlNode.type !== 'Literal') {
    provider.url = generate(urlNode);
  }

  return provider;
};

const astToNetworkOptions = (node: ESTree.ObjectExpression): INetworkOption => {
  const options: INetworkOption = {
    network_id: '*',
  };

  const id = findProperty(node, 'network_id');
  if (id && id.value.type === 'Literal' && (typeof id.value.value === 'string' || typeof id.value.value === 'number')) {
    options.network_id = id.value.value;
  }

  const port = findProperty(node, 'port');
  if (port && port.value.type === 'Literal' && typeof port.value.value === 'number') {
    options.port = port.value.value;
  }

  const host = findProperty(node, 'host');
  if (host && host.value.type === 'Literal' && typeof host.value.value === 'string') {
    options.host = host.value.value;
  }

  const websockets = findProperty(node, 'websockets');
  if (websockets && websockets.value.type === 'Literal' && typeof websockets.value.value === 'boolean') {
    options.websockets = websockets.value.value;
  }

  const gas = findProperty(node, 'gas');
  if (gas && gas.value.type === 'Literal' && typeof gas.value.value === 'number') {
    options.gas = gas.value.value;
  }

  const gasPrice = findProperty(node, 'gasPrice');
  if (gasPrice && gasPrice.value.type === 'Literal' && typeof gasPrice.value.value === 'number') {
    options.gasPrice = gasPrice.value.value;
  }

  const from = findProperty(node, 'from');
  if (from && from.value.type === 'Literal' && typeof from.value.value === 'string') {
    options.from = from.value.value;
  }

  const skipDryRun = findProperty(node, 'skipDryRun');
  if (skipDryRun && skipDryRun.value.type === 'Literal' && typeof skipDryRun.value.value === 'boolean') {
    options.skipDryRun = skipDryRun.value.value;
  }

  const timeoutBlocks = findProperty(node, 'timeoutBlocks');
  if (timeoutBlocks && timeoutBlocks.value.type === 'Literal' && typeof timeoutBlocks.value.value === 'number') {
    options.timeoutBlocks = timeoutBlocks.value.value;
  }

  const provider = findProperty(node, 'provider');

  if (provider) {
    if (provider.value.type === 'FunctionExpression') {
      const hdWalletProvider = walk.findNodeAt<ESTree.NewExpression>(
        provider as unknown as Node,
        undefined,
        undefined,
        isHDWalletProvider
      );
      if (hdWalletProvider && hdWalletProvider.node.type === 'NewExpression') {
        options.provider = astToHDWalletProvider(hdWalletProvider.node as unknown as ESTree.NewExpression);
      }
    } else if (provider.value.type === 'NewExpression') {
      options.provider = astToHDWalletProvider(provider.value);
    }
  }

  return options;
};

const astToNetworks = (node: ESTree.ObjectExpression): INetwork[] => {
  const networks: INetwork[] = [];

  node.properties.forEach((property) => {
    if (property.type === 'Property') {
      if (property.key.type === 'Identifier') {
        networks.push({
          name: property.key.name,
          options: astToNetworkOptions(property.value as ESTree.ObjectExpression),
        });
      }

      if (property.key.type === 'Literal') {
        networks.push({
          name: '' + property.key.value,
          options: astToNetworkOptions(property.value as ESTree.ObjectExpression),
        });
      }
    }
  });

  return networks;
};

//endregion

export class TruffleConfig {
  private readonly ast: Node;

  constructor(private readonly filePath: string) {
    const file = fs.readFileSync(this.filePath, 'utf8');
    this.ast = acorn.parse(file, {
      ecmaVersion: 'latest',
      allowHashBang: true,
      allowReserved: true,
      sourceType: 'module',
    }) as Node;
  }

  public getAST(): Node {
    return this.ast;
  }

  public writeAST(): void {
    return fs.writeFileSync(this.filePath, generate(this.ast, {comments: true}));
  }

  public getNetworks(): INetwork[] {
    const moduleExports = getModuleExportsObjectExpression(this.ast);
    if (moduleExports) {
      Telemetry.sendEvent('TruffleConfig.getNetworks.moduleExports');
      const networksNode = findProperty(moduleExports, 'networks');
      if (networksNode && networksNode.type === 'Property' && networksNode.value.type === 'ObjectExpression') {
        Telemetry.sendEvent('TruffleConfig.getNetworks.objectExpression');
        return astToNetworks(networksNode.value);
      }
    }
    return [];
  }

  public setNetworks(network: INetwork): void {
    const moduleExports = getModuleExportsObjectExpression(this.ast);

    if (moduleExports) {
      Telemetry.sendEvent('TruffleConfig.setNetworks.moduleExportsTrue');
      let networksNode = findProperty(moduleExports, 'networks');
      if (!networksNode) {
        Telemetry.sendEvent('TruffleConfig.setNetworks.noNetworksNode');
        networksNode = generateProperty('networks', generateObjectExpression());
        moduleExports.properties.push(networksNode);
      }

      if (networksNode.type === 'Property' && networksNode.value.type === 'ObjectExpression') {
        Telemetry.sendEvent('TruffleConfig.setNetworks.objectExpression');
        const isExist = findProperty(networksNode.value, network.name);
        if (isExist) {
          Telemetry.sendException(
            new Error(Constants.errorMessageStrings.NetworkAlreadyExist(Telemetry.obfuscate(network.name)))
          );
          throw new Error(Constants.errorMessageStrings.NetworkAlreadyExist(network.name));
        } else {
          Telemetry.sendEvent('TruffleConfig.setNetworks.addNetworkNode');
          const networkNode = generateProperty(network.name, generateObjectExpression());
          networkNode.value = networkOptionsToAst(network);
          networksNode.value.properties.push(networkNode);
        }
      }
    }
    this.writeAST();
  }

  public importPackage(variableName: string, packageName: string): void {
    const packageRequired = walk.findNodeAt(this.ast, undefined, undefined, isVarDeclaration(variableName));
    if (!packageRequired) {
      const declaration = generateVariableDeclaration(variableName, 'require', packageName);
      (this.ast as unknown as ESTree.Program).body.unshift(declaration);
      this.writeAST();
    }
  }

  public isHdWalletProviderDeclared(): boolean {
    try {
      const moduleExports = walk.findNodeAt(this.ast, undefined, undefined, isHdWalletProviderDeclaration);
      return !!moduleExports;
    } catch (error) {
      Telemetry.sendException(error as Error);
    }
    return false;
  }
}

export async function getTruffleConfiguration(
  workingDirectory?: string,
  truffleConfigName?: string
): Promise<IConfiguration> {
  const truffleConfig = await getTruffleMetadata(workingDirectory, truffleConfigName);

  if (truffleConfig) {
    return jsonToConfiguration(truffleConfig);
  }

  return Constants.truffleConfigDefaultDirectory;
}

/**
 * **TODO: Uses hardcoded `truffle-config.js` default.**
 *
 * Gets the path of the Truffle Config file from either
 * `truffleWorkspaceUri` when present, or the first open workspace.
 *
 * @param truffleWorkspaceUri the root of the Truffle config file, is any.
 * @returns the full path of the Truffle Config file.
 */
export function getTruffleConfigUri(truffleWorkspaceUri?: Uri): string {
  const workspaceRoot = truffleWorkspaceUri ? getPathByPlatform(truffleWorkspaceUri) : getWorkspaceRoot()!;
  const configFilePath = path.join(workspaceRoot, Constants.defaultTruffleConfigFileName);
  if (!fs.pathExistsSync(configFilePath)) {
    const error = new Error(Constants.errorMessageStrings.TruffleConfigIsNotExist);
    Telemetry.sendException(error);
    throw error;
  }

  return configFilePath;
}

export function generateMnemonic(): string {
  return entropyToMnemonic(crypto.randomBytes(16).toString('hex'));
}

/**
 * looking for truffle config named in old style
 * and rename it to truffle-config.js
 */
export function checkTruffleConfigNaming(workspaceRoot: string): void {
  // old-style of truffle config naming
  if (fs.pathExistsSync(path.join(workspaceRoot, 'truffle.js'))) {
    fs.renameSync(path.join(workspaceRoot, 'truffle.js'), path.join(workspaceRoot, 'truffle-config.js'));
  }
}
