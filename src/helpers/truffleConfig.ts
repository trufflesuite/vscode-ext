import * as acorn from 'acorn';
// @ts-ignore
import * as walk from 'acorn-walk';
import { generate } from 'astring';
import * as bip39 from 'bip39';
import * as crypto from 'crypto';
import * as ESTree from 'estree';
import * as fs from 'fs-extra';
import { RelativePattern, Uri, workspace } from 'vscode';
import { getWorkspaceRoot } from './workspace';

export namespace TruffleConfiguration {
  const notAllowedSymbols = new RegExp(
    /`|~|!|@|#|\$|%|\^|&|\*|\(|\)|\+|-|=|\[|{|]|}|\||\\|'|<|,|>|\?|\/|""|;|:|"|№|\s/g,
  );

  const ignore = [
    'build/**/*',
    'out/**/*',
    'dist/**/*',
    'test/**/*',
  ];

  const ignoreWorkspace = [
    ...ignore,
    'node_modules/**/*',
  ];

  interface IFound {
    node: ESTree.Node;
    state: string | undefined;
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
    /**
     * This identifier needs just for out extension.
     */
    consortium_id?: number;
  }

  export interface INetwork {
    name: string;
    options: INetworkOption;
  }

  export async function getTruffleConfigUri(): Promise<Uri[]> {
    const workspaceRoot = getWorkspaceRoot();
    const configFiles = await workspace.findFiles(
      new RelativePattern(workspaceRoot, '{**/truffle-config.js}'),
      new RelativePattern(workspaceRoot, `{${ignoreWorkspace.join(',')}}`),
    );

    if (configFiles.length < 1) {
      throw new Error('Configuration does not found');
    }

    return configFiles;
  }

  export function generateMnemonic(): string {
    return bip39.entropyToMnemonic(crypto.randomBytes(16).toString('hex'));
  }

  export class TruffleConfig {
    private ast?: ESTree.BaseNode;

    constructor(private readonly filePath: string) {  }

    public async getAST(): Promise<ESTree.BaseNode> {
      if (!this.ast) {
        const file = await fs.readFile(this.filePath, 'utf8');
        this.ast = acorn.parse(file, {
          allowHashBang: true,
          allowReserved: true,
          sourceType: 'module',
        });
      }

      return this.ast;
    }

    public async writeAST(): Promise<void> {
      return fs.writeFile(this.filePath, generate(this.ast as ESTree.Node, {comments: true}));
    }

    public async getNetworks(): Promise<INetwork[]> {
      const ast = await this.getAST();
      const networks: INetwork[] = [];
      const moduleExports: IFound = walk.findNodeAt(ast as ESTree.Node, null, null, isModuleExportsExpression);

      if (moduleExports.node) {
        const node = moduleExports.node as ESTree.ExpressionStatement;
        const rightExpression = (node.expression as ESTree.AssignmentExpression).right;

        if (rightExpression.type === 'ObjectExpression') {
          const networksNode = findProperty(rightExpression, 'networks');
          if (networksNode && networksNode.value.type === 'ObjectExpression') {
            networksNode.value.properties.forEach((property: ESTree.Property) => {
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
            });
          }
        }
      }

      return networks;
    }

    public async setNetworks(network: INetwork): Promise<void> {
      const ast = await this.getAST();
      const moduleExports: IFound = walk.findNodeAt(ast as ESTree.Node, null, null, isModuleExportsExpression);

      if (moduleExports.node) {
        const node = moduleExports.node as ESTree.ExpressionStatement;
        const rightExpression = (node.expression as ESTree.AssignmentExpression).right;

        if (rightExpression.type === 'ObjectExpression') {
          let networksNode = findProperty(rightExpression, 'networks');
          if (!networksNode) {
            networksNode = generateProperty('networks', generateObjectExpression());
            rightExpression.properties.push(networksNode);
          }

          if (networksNode.value.type === 'ObjectExpression') {
            const isExist = findProperty(networksNode.value, network.name);
            if (isExist) {
              throw Error(`Network with name ${network.name} already existed in truffle-config.js`);
            } else {
              const networkNode = generateProperty(network.name, generateObjectExpression());
              networkNode.value = networkOptionsToAst(network);
              networksNode.value.properties.push(networkNode);
            }
          }
        }
      }

      this.ast = ast;
      return this.writeAST();
    }

    public async importFs(): Promise<void> {
      const ast = await this.getAST();
      const fsRequired: IFound = walk.findNodeAt(ast as ESTree.Node, null, null, isVarDeclaration('fs'));
      if (!fsRequired) {
        const declaration = generateVariableDeclaration('fs', 'require', 'fs');
        (ast as ESTree.Program).body.unshift(declaration);
      }

      this.ast = ast;
      await this.writeAST();
    }
  }

  function isModuleExportsExpression(nodeType: string, node: ESTree.Node): boolean {
    if (nodeType !== 'ExpressionStatement') {
      return false;
    }

    node = node as ESTree.ExpressionStatement;

    if (
      node.expression.type === 'AssignmentExpression' &&
      node.expression.left.type === 'MemberExpression' &&
      node.expression.left.object.type === 'Identifier' &&
      node.expression.left.object.name === 'module'
    ) {
      if (
        (node.expression.left.property.type === 'Identifier' && node.expression.left.property.name === 'exports') ||
        (node.expression.left.property.type === 'Literal' && node.expression.left.property.value === 'module')
      ) {
        return true;
      }
    }

    return false;
  }

  function isHDWalletProvider(nodeType: string, node: ESTree.Node): boolean {
    if (nodeType === 'NewExpression') {
      node = node as ESTree.NewExpression;
      if (node.callee.type === 'Identifier' && node.callee.name === 'HDWalletProvider') {
        return true;
      }
    }
    return false;
  }

  function isVarDeclaration(varName: string): (nodeType: string, node: ESTree.Node)  => boolean {
    return (nodeType: string, node: ESTree.Node) => {
      if (nodeType === 'VariableDeclaration') {
        node = node as ESTree.VariableDeclaration;
        if (node.declarations[0].type === 'VariableDeclarator'
        && (node.declarations[0].id as ESTree.Identifier).name === varName) {
          return true;
        }
      }
      return false;
    };
  }

  function findProperty(node: ESTree.Node, propertyName: string): ESTree.Property | void {
    if (node.type === 'ObjectExpression') {
      node = node as ESTree.ObjectExpression;

      return node.properties.find((property: ESTree.Property) => {
        return (property.key.type === 'Identifier' && property.key.name === propertyName) ||
          (property.key.type === 'Literal' && `${property.key.value}` === propertyName);
      });
    }
  }

  function astToNetworkOptions(node: ESTree.ObjectExpression): INetworkOption {
    const options: INetworkOption = {
      network_id: '*',
    };

    const id = findProperty(node, 'network_id');
    if (id && id.value.type === 'Literal' &&
       (typeof id.value.value === 'string' || typeof id.value.value === 'number')) {
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
    if (provider && provider.value.type === 'FunctionExpression') {
      const hdWalletProvider: IFound = walk.findNodeAt(provider, null, null, isHDWalletProvider);
      if (hdWalletProvider.node && hdWalletProvider.node.type === 'NewExpression') {
        options.provider = astToHDWalletProvider(hdWalletProvider.node);
      }
    }

    if (provider && provider.value.type === 'NewExpression') {
      options.provider = astToHDWalletProvider(provider.value);
    }

    const consortiumId = findProperty(node, 'consortium_id');
    if (consortiumId && consortiumId.value.type === 'Literal' && typeof consortiumId.value.value === 'number') {
      options.consortium_id = consortiumId.value.value;
    }

    return options;
  }

  function networkOptionsToAst(network: INetwork): ESTree.ObjectExpression {
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

    if (options.consortium_id !== undefined) {
      obj.properties.push(generateProperty('consortium_id', generateLiteral(options.consortium_id)));
    }

    return obj;
  }

  function astToHDWalletProvider(node: ESTree.NewExpression): IProvider {
    const provider: IProvider = {
      raw: generate(node),
    };

    const mnemonicNode = node.arguments[0];
    if (mnemonicNode && mnemonicNode.type === 'Literal') {
      provider.mnemonic = '' + mnemonicNode.value;
    }

    const urlNode = node.arguments[1];
    if (urlNode && urlNode.type === 'Literal') {
      provider.url = '' + urlNode.value;
    }

    if (urlNode && urlNode.type !== 'Literal') {
      provider.url = generate(urlNode);
    }

    return provider;
  }

  function hdWalletProviderToAst(provider: IProvider): ESTree.NewExpression {
    return {
      arguments: [
        generateFsReadExpression('fs.readFileSync', (provider.mnemonic || '').replace(/\\/g, '\\\\')),
        generateLiteral(provider.url || ''),
      ],
      callee: {
        name: 'HDWalletProvider',
        type: 'Identifier',
      },
      type: 'NewExpression',
    };
  }

  function generateProperty(name: string, value: ESTree.Expression): ESTree.Property {
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
  }

  function generateObjectExpression(): ESTree.ObjectExpression {
    return {
      properties: [],
      type: 'ObjectExpression',
    };
  }

  function generateIdentifier(name: string): ESTree.Identifier {
    return {
      name,
      type: 'Identifier',
    };
  }

  function generateLiteral(value: string | number | boolean | null): ESTree.Literal {
    return {
      raw: JSON.stringify(value),
      type: 'Literal',
      value,
    };
  }

  function generateFsReadExpression(operator: string, args: string): ESTree.CallExpression {
    const call = {
      arguments: [
        {
          raw: `\'${args}\'`,
          type: 'Literal',
          value: `${args}`,
        },
        {
          raw: "\'utf-8\'",
          type: 'Literal',
          value: 'utf-8',
        },
      ],
      callee: {
        name: operator,
        type: 'Identifier',
      },
      type: 'CallExpression',
    };
    return call as ESTree.CallExpression;
  }

  function generateVariableDeclaration(varName: string, loader: string, loaderArg: string): ESTree.VariableDeclaration {
    const declaration = {
      declarations: [
        {
          id: {
            name: varName,
            type: 'Identifier',
          },
          init: {
            arguments: [
              {
                raw: `\'${loaderArg}\'`,
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
    };
    return declaration as ESTree.VariableDeclaration;
  }
}
