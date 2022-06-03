# Truffle for VS Code

[![CI](https://github.com/trufflesuite/vscode-ext/actions/workflows/main.yml/badge.svg)](https://github.com/trufflesuite/vscode-ext/actions/workflows/main.yml)

> **Installation or Setup Issues?** Checkout out our [comprehensive troubleshooting guide](https://trufflesuite.com/docs/vscode-ext/installation-guide/).

Truffle for VS Code simplifies how you create, build, debug and deploy smart contracts on [Ethereum](https://ethereum.org) and all EVM-compatible blockchains and layer 2 scaling solutions. The extension has built-in integration with a growing number of tools and services including [Truffle](https://trufflesuite.com/docs/truffle), [Ganache](https://trufflesuite.com/docs/ganache), and [Infura](https://infura.io/).

## Native IDE Debugging

*Please note that this is a beta release of the IDE debugger and there are some known (and possibly unknown) issues that we are actively resolving. Feel free to review status and / or open any new issues or feature requests [here](https://github.com/trufflesuite/vscode-ext/issues).*

Truffle for VS Code also offers comprehensive native IDE [Solidity](https://docs.soliditylang.org/) debugging support, taking advantage of VS Code's great debugging features such variables, watches, and breakpoints. No more jumping between differents tools or windows during your edit, compile, deploy, transact, debug loop.

![in-ide debugging example](images/ide-debugging.png)

## Getting Started

### Installation

To install this extension to VS Code, simply click the "Install" button above. Beyond this, there are some local dependencies you may have already installed. If not, the extension will prompt you accordingly. To help smooth out the dependency installation process, we've created a guide which you can find [here](https://trufflesuite.com/docs/vscode-ext/installation-guide/).

### Create a New Project

The Truffle for VS Code was built to work effectively for both new users to Ethereum, but not get in the way for those familiar with the process. One of the primary goals is to help users create a project structure for developing smart contracts, help in the compilation and building of these assets, deployment of these assets to blockchain endpoints as well as debugging of these contracts.

Developers that are familiar with Truffle CLI may use `e.g., truffle init` directly from the VS Code terminal, if they like.

For developers who are not familiar with Truffle, or prefer to use the Command Palette, the extension can easily scaffold out a project directory using the following steps.

1. From the Command Palette, type `Truffle: New Solidity Project`
2. Select an empty directory to scaffold out your project.
3. Choose a name for your project.
4. Press Enter.
## Build your smart contracts

Your newly scaffolded-out directory includes a simple contract and all the necessary files to build and deploy a simple, and working contract to an RPC-endpoint. Use the following steps to build your contract:

1. Select your contract Solidity (.sol) file, right-click and choose `Build Contracts`

## Deploy to the RPC endpoint

Once compiled, you will have your contract, contract metadata (e.g., contract ABI, bytecode) available in the smart contract .json file which will be located in the `./build directory`. The next step is to deploy these contracts to a network.

For new users, this can be hard to understand, because there are multiple steps that need to occur for the deployment to be successful. To ease this burden, the extension provides a simple model to deploy to various networks. By default, this will be a local network, using Ganache. The extension will start and run an instance of ganache for the user. The options to initiate this deployment are below.

1. Select your contract Solidity (.sol) file, right click and choose `Deploy Contracts`

## Deploy with Truffle Ganache locally

For rapid development of smart contracts, having the ability to deploy contracts to a blockchain quickly for testing and debugging purposes is a key principle. One of the most popular models to achieve this is using [Ganache](https://trufflesuite.com/docs/ganache/), which acts as a local blockchain simulator to allow this quick deployment and iteration that is ideal for developers.

The extension has integrated Ganache directly into the IDE to further lower the barrier to entry, and allow even faster development iteration. By default, there is nothing to configure, and the following steps can be used.

1. After selecting to deploy the contracts, either from the Command Palette or by right clicking on the contract and selecting Deploy contracts, a dropdown will be presented with options for _where_ to deploy the contract. By default there will be a single entry on this list named development.

2. After selecting development, the IDE will create a new instance of Truffle Ganache, which will use the default configuration for the project as the target. The IDE will then deploy the contracts to this instance.


**OPTIONAL**: If there is a need to control this Ganache instance more or change the configuration, there are some other options that can be used that the IDE can help with as well.

1. If there is a need to run the Ganache instance on a port other than the default of 8545, a new Local Network can be created and the port configuration added for this. The steps do this are:

   a. Expand the Blockchain view in the extension by clicking the name.

   b. Next click Create a new network.

   c. Select Ganache Service

   d. Provide a name for this service that will be referenced when targeting it from deployment.

   e. Enter the port number to use for this local network.

## Deploy with Infura to Ethereum mainnet and testnets

If you are a developer that would like to target public testnet and mainnet for Ethereum, the ability to leverage Infura from inside the IDE is provided via this extension.

For those that aren't familiar with Infura, it provides the tools and infrastructure that allow developers to easily take their blockchain application from testing to scaled deployment - with simple, reliable access to Ethereum mainnet and testnets, and also has support for IPFS. Details can be found on the [Getting started with Infura blog](https://blog.infura.io/getting-started-with-infura-28e41844cc89/) and on the [Infura Docs pages](https://infura.io/docs).

To use Infura, the first step is to either create or connect to an existing Infura project. The IDE will step through this process.

1. Expand the Blockchain view in the extension by clicking the name.

2. Next click Create a new network.

3. Select Infura Service.

4. At this point the extension will prompt you for credentials to sign into Infura. Simply click the sign in button. Don't worry if you don't already have an Infura account, because you can create one if needed.

5. On the Infura login page, login with your Infura account credentials. If you don't already have an Infura account, simply click the Sign Up link at the bottom.

6. After signing into Infura, you will be askted for authorization to share your Infura projects with the extension. Click Authorize.

7. Next close the browser window and you will back in the IDE. A prompt will be presented to allow you to enter a project name. Enter the desired name for this.

8. Next select the availability of the project inside Infura (public or private). By default, public is the option used.

9. After a few seconds, the Blockchain view will show a new Infura Service, with your project nested under, and under this will the various endpoints that Infura provides.

10. Now that a connection to Infura has been created, this network can easily be targeted when deploying contracts. When right clicking and deploying contracts, a set of options will be added for these new Infura destinations.

11. Simply select the desired target network endpoint and the extension will deploy the contracts to this location.

## Deploy with Hyperledger Besu

Hyperledger Besu is a popular Ethereum client that is unique in that it offers a client that can be used in either public networks, such as Ethereum mainnet or private, consortium based networks. It can be deployed a variety of [ways](https://besu.hyperledger.org/en/stable/HowTo/Get-Started/Install-Binaries/), and recently a preview has been made available in [Azure](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/consensys.hyperledger-besu-quickstart?tab=Overview).

Currently, the Hyperledger Besu is fully compatible with the extension, however the provisioning of the nodes is not yet fully integrated. To connect to a running Besu node with the extension, you can do the following:

1. Deploy Hyperledger Besu locally or in the cloud (see links in above).

2. Retrieve the JSON rpc endpoint that will be used to communicate with the Besu network. This varies based on the deployment model, for Azure deployments these can be retrieved from the output parameters from the deployment.

3. Update the configuration manually. This is shown in the video below. The extension has the ability to use an HD Wallet provider that simply requires a file with a mnemonic to function.

Add the following to the configuration:

```javascript
besu: {
   network_id: "*",
   gas: 0,
   gasPrice: 0,
   provider: new HDWalletProvider(
     fs.readFileSync("<path to a file with a mnemonic>", "utf-8"),
     "<besu jsonrpc endpoint>"
   ),
 },
```

## System Requirements

- Supported Operating Systems
  - Windows 10
  - Mac OSX
  - Linux
- VS Code 1.60.0 (or greater)
- Node 14.17.3 (or greater)
- NPM 7.18.1 (or greater)
- Git 2.10.x (or greater)

**Our [Docs page](https://trufflesuite.com/docs/) includes a comprehensive getting started guide with detailed usage instructions for this plugin**

## Development

We welcome pull requests. To get started, just fork this repo, clone it locally, and run:

```shell
# Install
npm install -g yarn
yarn install

# Test
yarn test
```

There are more docs online at the VS Code website on how to develop plugins at the [VS Code Docs - Extension API](https://code.visualstudio.com/api).

## License

MIT

## Telemetry

VS Code collects usage data and sends it to ConsenSys Software Incorporated to help improve its products and services. Read our [privacy statement](https://consensys.net/privacy-policy/) to learn more. If you don’t wish to send usage data, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more at the [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).
