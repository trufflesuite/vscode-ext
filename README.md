# Azure Blockchain Development Kit

[![Version](https://vsmarketplacebadge.apphb.com/version/AzBlockchain.azure-blockchain.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-logicapps) [![Installs](https://vsmarketplacebadge.apphb.com/installs/AzBlockchain.azure-blockchain.svg)](https://marketplace.visualstudio.com/items?itemName=AzBlockchain.azure-blockchain) [![Rating](https://vsmarketplacebadge.apphb.com/rating-star/AzBlockchain.azure-blockchain.svg)](https://marketplace.visualstudio.com/items?itemName=AzBlockchain.azure-blockchain#review-details) [![Build status](https://msazure.visualstudio.com/Blockchain/_apis/build/status/Blockchain-VS-Extensions/Blockchain-VS-Extension-Prod)](https://msazure.visualstudio.com/Blockchain/_build/latest?definitionId=71311)

Azure Blockchain Development Kit simplifies how you create, connect to, build and deploy smart contracts on Ethereum ledgers.

**Our [Wiki page](https://github.com/Microsoft/vscode-azure-blockchain-ethereum/wiki) includes a comprehensive getting started guide with detailed usage instructions for this plugin**

## Prerequisites

1. If you do not have an Azure subscription, create a [free account](https://azure.microsoft.com/free/?WT.mc_id=A261C142F) before you begin.

## System Requirements

- Supported Operating Systems
  - Windows 10
  - Mac OSX
- VS Code 1.32.0 (or greater)
- Python 2.7.15
- Node 10.15.x
- Git 2.10.x

## Create an Azure Blockchain Service

The first thing to do is to create an Azure Blockchain Service in your subscription. You can do this directly through VS Code once you've installed this extension.

1. Click `-> Create Azure Blockchain Service` in the AZURE BLOCKCHAIN tab, or type `Azure Blockchain: Create Azure Blockchain Service` in the [Command Palette](https://github.com/Microsoft/vscode-azure-blockchain-ethereum/wiki/Command-Palette).

   ![Create and Azure Blockchain Service](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/createConsortium.png)

2. Choose your subscription, resource group and region to deploy to.

4. Enter the name of your [Consortium](https://docs.microsoft.com/azure/blockchain/service/consortium) 

5. Wait until your resource has been created in Azure.
   `Note: Deploying the Azure Blockchain Service takes quite some time to complete. Please check the deployment status in the Azure portal.` 

## Create a new Solidity Contract

The Azure Blockchain Developer Kit for Ethereum leverages the [Truffle Suite](https://truffleframework.com/) of tools to help scaffold, build and deploy contracts.

Developers that are familiar with Truffle Suite may use the Truffle command line `e.g., Truffle Init` directly from the VS Code terminal.

For developers who are not familiar with Truffle, or prefer to use the Command Palette, the Azure Blockchain Toolkit for Ethereum can easily scaffold out a project directory using the following steps.

1. From the [Command Palette](https://github.com/Microsoft/vscode-azure-blockchain-ethereum/wiki/Command-Palette), type `Azure Blockchain: New Solidity Project`

   ![Command Palette - New Solidity Project](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/createNewProject.gif) 

2. Select an empty directory to scaffold out your project.

3. Choose a name for your contract.

4. Enter.

Once complete, your project directory should look like this:

[![completed directory](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/newProjectDirCloseup.png)](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/newProjectDir.png#lightbox)


## Build your Solidity Contract

Your newly scaffolded out directory includes a simple contract and all the necessary files to build and deploy a simple, working, contract to the Azure Blockchain Service. Use the following steps to build your contract

#### Option 1: Command Palette

1. From the [Command Palette](https://github.com/Microsoft/vscode-azure-blockchain-ethereum/wiki/Command-Palette), type `Azure Blockchain: Build Contracts`

   ![Command Palette - Build Contracts](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/buildContracts.png)

#### Option 2: Right click on your .sol file

1. Select your contract Solidity (.sol) file, right click and choose `Build Contracts`

   ![Right click shortcut - build contracts](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/buildContractRightClick.gif)

## Deploy your smart contract to Azure Blockchain Service

Once compiled, you will have your contract, contract metadata (e.g., contract ABI, bytecode) available in the smart contract .json file which will be located in the`./build directory` 

Once you deployment/creation of the Azure Blockchain Service is complete you will also see that consortium in your VS Code Blockchain tab. Once all these components are ready, deploying your new contract is simple and fast. Use the following steps to deploy your contract

#### Option 1: Command Palette

1. From the [Command Palette](https://github.com/Microsoft/vscode-azure-blockchain-ethereum/wiki/Command-Palette), type `Azure Blockchain: Deploy Contracts`

   ![Command Palette - Deploy Contracts](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/deployContracts.png)

#### Option 2: Right click on your .sol file

1. Select your contract Solidity (.sol) file, right click and choose `Deploy Contracts`

   ![Right click smart contract - deploy contract](https://raw.githubusercontent.com/Microsoft/vscode-azure-blockchain-ethereum/master/images/deployContractsRightClick.png)

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Telemetry

VS Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://go.microsoft.com/fwlink/?LinkID=528096&clcid=0x409) to learn more. If you don’t wish to send usage data to Microsoft, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).