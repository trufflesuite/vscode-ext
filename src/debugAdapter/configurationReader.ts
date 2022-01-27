// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

// The same implementation as in helpers/truffleConfig.ts
// The difference is that all code which uses 'vscode' module is removed.
// TODO: think how to reuse code
import * as acorn from "acorn";
// @ts-ignore
import * as walk from "acorn-walk";
import {generate} from "astring";
import {entropyToMnemonic} from "bip39";
import crypto from "crypto";
import ESTree from "estree";
import fs from "fs-extra";
import path from "path";
import {tryExecuteCommandInFork} from "./cmdCommandExecutor";

export namespace ConfigurationReader {
  const notAllowedSymbols = new RegExp(
    /`|~|!|@|#|\$|%|\^|&|\*|\(|\)|\+|-|=|\[|{|]|}|\||\\|'|<|,|>|\?|\/|""|;|:|"|№|\s/g
  );

  interface IFound {
    node: ESTree.Node;
    state: string;
  }

  export interface IProvider {
    mnemonic?: string;
    raw?: string;
    url?: string;
  }

  export interface INetworkOption {
    /**
     * Ethereum public network
     * if "*" - match any network
     */
    network_id: string | number;
    port?: number;
    host?: string;
    /**
     * You will need this enabled to use the confirmations listener
     * or to hear Events using .on or .once. Default is false.
     */
    websockets?: boolean;
    /**
     * Gas limit used for deploys. Default is 4712388.
     */
    gas?: number;
    /**
     * Gas price used for deploys. Default is 100000000000 (100 Shannon).
     */
    gasPrice?: number;
    /**
     * From address used during migrations. Defaults to the first available account provided by your Ethereum client.
     */
    from?: string;
    /**
     * Function that returns a web3 provider instance.
     * web3 provider instance Truffle should use to talk to the Ethereum network.
     * if specified, host and port are ignored.
     * Default web3 provider using host and port options: new Web3.providers.HttpProvider("http://<host>:<port>")
     */
    provider?: IProvider;
    /**
     * true if you don't want to test run the migration locally before the actual migration (default is false)
     */
    skipDryRun?: boolean;
    /**
     * if a transaction is not mined, keep waiting for this number of blocks (default is 50)
     */
    timeoutBlocks?: number;
  }

  export interface INetwork {
    name: string;
    options: INetworkOption;
  }

  export interface ISolCompiler {
    /**
     * A version or constraint - Ex. "^0.5.0" . Can also be set to "native" to use a native solc
     */
    version: string;
    /**
     * Use a version obtained through docker
     */
    docker?: boolean;
    settings?: {
      optimizer?: {
        enabled: boolean;
        /**
         * Optimize for how many times you intend to run the code
         */
        runs: number;
      };
      /**
       * Default: "byzantium"
       */
      evmVersion?: string;
    };
  }

  export interface IExternalCompiler {
    command: string;
    workingDirectory: string;
    targets: object[];
  }

  export interface IConfiguration {
    contracts_directory: string;
    build_directory: string;
    contracts_build_directory: string;
    migrations_directory: string;
    networks?: INetwork[];
    compilers?: {
      solc?: ISolCompiler;
      external?: IExternalCompiler;
    };
  }

  export function generateMnemonic(): string {
    return entropyToMnemonic(crypto.randomBytes(16).toString("hex"));
  }

  /**
   * looking for truffle config named in old style
   * and rename it to truffle-config.js
   */
  export function checkTruffleConfigNaming(workspaceRoot: string): void {
    // old-style of truffle config naming
    if (fs.pathExistsSync(path.join(workspaceRoot, "truffle.js"))) {
      fs.renameSync(path.join(workspaceRoot, "truffle.js"), path.join(workspaceRoot, "truffle-config.js"));
    }
  }

  export class TruffleConfig {
    private readonly ast: ESTree.Node;

    constructor(private readonly filePath: string) {
      const file = fs.readFileSync(this.filePath, "utf8");
      this.ast = acorn.parse(file, {
        allowHashBang: true,
        allowReserved: true,
        sourceType: "module",
      }) as ESTree.Node;
    }

    public getAST(): ESTree.Node {
      return this.ast;
    }

    public writeAST(): void {
      return fs.writeFileSync(this.filePath, generate(this.ast, {comments: true}));
    }

    public getNetworks(): INetwork[] {
      const moduleExports = getModuleExportsObjectExpression(this.ast);

      if (moduleExports) {
        const networksNode = findProperty(moduleExports, "networks");
        if (networksNode && networksNode.value.type === "ObjectExpression") {
          return astToNetworks(networksNode.value);
        }
      }

      return [];
    }

    public setNetworks(network: INetwork): void {
      const moduleExports = getModuleExportsObjectExpression(this.ast);

      if (moduleExports) {
        let networksNode = findProperty(moduleExports, "networks");
        if (!networksNode) {
          networksNode = generateProperty("networks", generateObjectExpression());
          moduleExports.properties.push(networksNode);
        }

        if (networksNode.value.type === "ObjectExpression") {
          const isExist = findProperty(networksNode.value, network.name);
          if (isExist) {
            throw new Error("Network already exists");
          } else {
            const networkNode = generateProperty(network.name, generateObjectExpression());
            networkNode.value = networkOptionsToAst(network);
            networksNode.value.properties.push(networkNode);
          }
        }
      }

      this.writeAST();
    }

    public importPackage(variableName: string, packageName: string): void {
      const packageRequired: IFound = walk.findNodeAt(this.ast, null, null, isVarDeclaration(variableName));
      if (!packageRequired) {
        const declaration = generateVariableDeclaration(variableName, "require", packageName);
        (this.ast as ESTree.Program).body.unshift(declaration);
        this.writeAST();
      }
    }

    public async getConfiguration(workingDirectory: string): Promise<IConfiguration> {
      const truffleConfig = await getTruffleMetadata(workingDirectory);

      if (truffleConfig) {
        return jsonToConfiguration(truffleConfig);
      }

      return getDefaultConfiguration();
    }

    public isHdWalletProviderDeclared(): boolean {
      try {
        const moduleExports = walk.findNodeAt(this.ast, null, null, isHdWalletProviderDeclaration);
        return !!moduleExports;
      } catch (error) {
        // ignore
      }
      return false;
    }
  }

  function isHdWalletProviderDeclaration(nodeType: string, node: ESTree.Node): boolean {
    if (nodeType !== "NewExpression") {
      return false;
    }
    node = node as ESTree.NewExpression;
    node = node.callee as ESTree.Identifier;
    return node.name === "HDWalletProvider";
  }

  function getModuleExportsObjectExpression(ast: ESTree.Node): ESTree.ObjectExpression | void {
    const moduleExports: IFound = walk.findNodeAt(ast, null, null, isModuleExportsExpression);

    if (moduleExports && moduleExports.node.type === "ExpressionStatement") {
      const rightExpression = (moduleExports.node.expression as ESTree.AssignmentExpression).right;

      if (rightExpression.type === "ObjectExpression") {
        return rightExpression;
      }
    }
  }

  async function getTruffleMetadata(workingDirectory: string): Promise<IConfiguration> {
    const truffleConfigTemplatePath =
      typeof IS_BUNDLE_TIME === "undefined" || IS_BUNDLE_TIME === false
        ? path.join(__dirname, "..", "helpers", "checkTruffleConfigTemplate.js")
        : path.join(__dirname, "checkTruffleConfigTemplate.js");
    const truffleConfigPath = path.relative(
      path.dirname(truffleConfigTemplatePath),
      path.join(workingDirectory, "truffle-config.js")
    );

    const result = await tryExecuteCommandInFork(workingDirectory, truffleConfigTemplatePath, truffleConfigPath);
    const truffleConfigObject = result.messages!.find((message) => message.command === "truffleConfig");

    if (!truffleConfigObject || !truffleConfigObject.message) {
      throw new Error('"truffle-config.js" has incorrect format');
    }

    return JSON.parse(truffleConfigObject.message);
  }

  function getDefaultConfiguration(): IConfiguration {
    return {
      build_directory: path.join("./", "build"),
      contracts_build_directory: path.join("./", "build", "contracts"),
      contracts_directory: path.join("./", "contracts"),
      migrations_directory: path.join("./", "migrations"),
    };
  }

  function isModuleExportsExpression(nodeType: string, node: ESTree.Node): boolean {
    if (nodeType !== "ExpressionStatement") {
      return false;
    }

    node = node as ESTree.ExpressionStatement;

    if (
      node.expression.type === "AssignmentExpression" &&
      node.expression.left.type === "MemberExpression" &&
      node.expression.left.object.type === "Identifier" &&
      node.expression.left.object.name === "module"
    ) {
      if (
        (node.expression.left.property.type === "Identifier" && node.expression.left.property.name === "exports") ||
        (node.expression.left.property.type === "Literal" && node.expression.left.property.value === "module")
      ) {
        return true;
      }
    }

    return false;
  }

  function isHDWalletProvider(nodeType: string, node: ESTree.Node): boolean {
    if (nodeType === "NewExpression") {
      node = node as ESTree.NewExpression;
      if (node.callee.type === "Identifier" && node.callee.name === "HDWalletProvider") {
        return true;
      }
    }
    return false;
  }

  function isVarDeclaration(varName: string): (nodeType: string, node: ESTree.Node) => boolean {
    return (nodeType: string, node: ESTree.Node) => {
      if (nodeType === "VariableDeclaration") {
        node = node as ESTree.VariableDeclaration;
        if (
          node.declarations[0].type === "VariableDeclarator" &&
          (node.declarations[0].id as ESTree.Identifier).name === varName
        ) {
          return true;
        }
      }
      return false;
    };
  }

  function findProperty(node: ESTree.Node, propertyName: string): ESTree.Property | void {
    if (node.type === "ObjectExpression") {
      node = node as ESTree.ObjectExpression;

      return node.properties.find((property: ESTree.Property) => {
        return (
          (property.key.type === "Identifier" && property.key.name === propertyName) ||
          (property.key.type === "Literal" && `${property.key.value}` === propertyName)
        );
      });
    }
  }

  function astToNetworkOptions(node: ESTree.ObjectExpression): INetworkOption {
    const options: INetworkOption = {
      network_id: "*",
    };

    const id = findProperty(node, "network_id");
    if (
      id &&
      id.value.type === "Literal" &&
      (typeof id.value.value === "string" || typeof id.value.value === "number")
    ) {
      options.network_id = id.value.value;
    }

    const port = findProperty(node, "port");
    if (port && port.value.type === "Literal" && typeof port.value.value === "number") {
      options.port = port.value.value;
    }

    const host = findProperty(node, "host");
    if (host && host.value.type === "Literal" && typeof host.value.value === "string") {
      options.host = host.value.value;
    }

    const websockets = findProperty(node, "websockets");
    if (websockets && websockets.value.type === "Literal" && typeof websockets.value.value === "boolean") {
      options.websockets = websockets.value.value;
    }

    const gas = findProperty(node, "gas");
    if (gas && gas.value.type === "Literal" && typeof gas.value.value === "number") {
      options.gas = gas.value.value;
    }

    const gasPrice = findProperty(node, "gasPrice");
    if (gasPrice && gasPrice.value.type === "Literal" && typeof gasPrice.value.value === "number") {
      options.gasPrice = gasPrice.value.value;
    }

    const from = findProperty(node, "from");
    if (from && from.value.type === "Literal" && typeof from.value.value === "string") {
      options.from = from.value.value;
    }

    const skipDryRun = findProperty(node, "skipDryRun");
    if (skipDryRun && skipDryRun.value.type === "Literal" && typeof skipDryRun.value.value === "boolean") {
      options.skipDryRun = skipDryRun.value.value;
    }

    const timeoutBlocks = findProperty(node, "timeoutBlocks");
    if (timeoutBlocks && timeoutBlocks.value.type === "Literal" && typeof timeoutBlocks.value.value === "number") {
      options.timeoutBlocks = timeoutBlocks.value.value;
    }

    const provider = findProperty(node, "provider");
    if (provider && provider.value.type === "FunctionExpression") {
      const hdWalletProvider: IFound = walk.findNodeAt(provider, null, null, isHDWalletProvider);
      if (hdWalletProvider && hdWalletProvider.node.type === "NewExpression") {
        options.provider = astToHDWalletProvider(hdWalletProvider.node);
      }
    }

    if (provider && provider.value.type === "NewExpression") {
      options.provider = astToHDWalletProvider(provider.value);
    }

    return options;
  }

  function networkOptionsToAst(network: INetwork): ESTree.ObjectExpression {
    const obj: ESTree.ObjectExpression = {
      properties: [],
      type: "ObjectExpression",
    };
    const options = network.options;

    if (options.network_id !== undefined) {
      obj.properties.push(generateProperty("network_id", generateLiteral(options.network_id)));
    }

    if (options.port !== undefined) {
      obj.properties.push(generateProperty("port", generateLiteral(options.port)));
    }

    if (options.host !== undefined) {
      obj.properties.push(generateProperty("host", generateLiteral(options.host)));
    }

    if (options.websockets !== undefined) {
      obj.properties.push(generateProperty("websockets", generateLiteral(options.websockets)));
    }

    if (options.gas !== undefined) {
      obj.properties.push(generateProperty("gas", generateLiteral(options.gas)));
    }

    if (options.gasPrice !== undefined) {
      obj.properties.push(generateProperty("gasPrice", generateLiteral(options.gasPrice)));
    }

    if (options.from !== undefined) {
      obj.properties.push(generateProperty("from", generateLiteral(options.from)));
    }

    if (options.skipDryRun !== undefined) {
      obj.properties.push(generateProperty("skipDryRun", generateLiteral(options.skipDryRun)));
    }

    if (options.timeoutBlocks !== undefined) {
      obj.properties.push(generateProperty("timeoutBlocks", generateLiteral(options.timeoutBlocks)));
    }

    if (options.provider !== undefined) {
      obj.properties.push(generateProperty("provider", hdWalletProviderToAst(options.provider)));
    }

    return obj;
  }

  function astToHDWalletProvider(node: ESTree.NewExpression): IProvider {
    const provider: IProvider = {
      raw: generate(node),
    };

    const mnemonicNode = node.arguments[0];
    if (mnemonicNode && mnemonicNode.type === "Literal") {
      provider.mnemonic = "" + mnemonicNode.value;
    }

    const urlNode = node.arguments[1];
    if (urlNode && urlNode.type === "Literal") {
      provider.url = "" + urlNode.value;
    }

    if (urlNode && urlNode.type !== "Literal") {
      provider.url = generate(urlNode);
    }

    return provider;
  }

  function hdWalletProviderToAst(provider: IProvider): ESTree.NewExpression {
    return {
      arguments: [
        generateFsReadExpression("fs.readFileSync", (provider.mnemonic || "").replace(/\\/g, "\\\\")),
        generateLiteral(provider.url || ""),
      ],
      callee: {
        name: "HDWalletProvider",
        type: "Identifier",
      },
      type: "NewExpression",
    };
  }

  function jsonToConfiguration(truffleConfig: {[key: string]: any}): IConfiguration {
    const {build_directory, contracts_directory, contracts_build_directory, migrations_directory} =
      getDefaultConfiguration();

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

    return truffleConfig as IConfiguration;
  }

  function astToNetworks(node: ESTree.ObjectExpression): INetwork[] {
    const networks: INetwork[] = [];

    node.properties.forEach((property: ESTree.Property) => {
      if (property.key.type === "Identifier") {
        networks.push({
          name: property.key.name,
          options: astToNetworkOptions(property.value as ESTree.ObjectExpression),
        });
      }

      if (property.key.type === "Literal") {
        networks.push({
          name: "" + property.key.value,
          options: astToNetworkOptions(property.value as ESTree.ObjectExpression),
        });
      }
    });

    return networks;
  }

  function generateProperty(name: string, value: ESTree.Expression): ESTree.Property {
    notAllowedSymbols.lastIndex = 0;
    const isLiteral = notAllowedSymbols.test(name);

    return {
      computed: false,
      key: isLiteral ? generateLiteral(name) : generateIdentifier(name),
      kind: "init",
      method: false,
      shorthand: false,
      type: "Property",
      value,
    };
  }

  function generateObjectExpression(): ESTree.ObjectExpression {
    return {
      properties: [],
      type: "ObjectExpression",
    };
  }

  function generateIdentifier(name: string): ESTree.Identifier {
    return {
      name,
      type: "Identifier",
    };
  }

  function generateLiteral(value: string | number | boolean | null): ESTree.Literal {
    return {
      raw: JSON.stringify(value),
      type: "Literal",
      value,
    };
  }

  function generateFsReadExpression(operator: string, args: string): ESTree.CallExpression {
    const call = {
      arguments: [
        {
          raw: `\'${args}\'`,
          type: "Literal",
          value: `${args}`,
        },
        {
          raw: "'utf-8'",
          type: "Literal",
          value: "utf-8",
        },
      ],
      callee: {
        name: operator,
        type: "Identifier",
      },
      type: "CallExpression",
    };
    return call as ESTree.CallExpression;
  }

  function generateVariableDeclaration(varName: string, loader: string, loaderArg: string): ESTree.VariableDeclaration {
    const declaration = {
      declarations: [
        {
          id: {
            name: varName,
            type: "Identifier",
          },
          init: {
            arguments: [
              {
                raw: `\'${loaderArg}\'`,
                type: "Literal",
                value: `${loaderArg}`,
              },
            ],
            callee: {
              name: loader,
              type: "Identifier",
            },
            type: "CallExpression",
          },
          type: "VariableDeclarator",
        },
      ],
      kind: "const",
      type: "VariableDeclaration",
    };
    return declaration as ESTree.VariableDeclaration;
  }
}
