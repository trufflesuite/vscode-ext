# Change Log

All notable changes to the "Truffle for VSCode" extension will be documented in this file.

## 2.2.3

- Massive required apps validation has been removed
- Ganache commands have been added to extension initialization

## 2.2.1

- Had to bump a version due to semver. Some copy fixes added in here.

## 2.1.9

- Including troubleshooting guide link in README

## 2.1.7

- Improved handling of unknown storage variables
- Increased debugger timeout to 30 seconds

## 2.1.5

- Readme fixes/copy changes.

## 2.1.4

- Cleaning up doc links.

## 2.1.3

- Debugger timeout increase

## 2.0.0

### Enhancements

- This is the first iteration of the plugin as Truffle for VSCode.

## 1.6.2

### Enhancements

- Removed the Smart Contract Interaction options for contracts. A new version of this interaction will be implemented in a future release.

### Fixes

### Internal Improvements

## 1.6.1

### Enhancements

### Fixes

- Fixed bug with astring and the associated typings to resolve the build issues with the later version of the core library.

### Internal Improvements

## 1.6.0

### Enhancements

- Removed the dependency of Python for this extension. This was required by a nested component used by the exntension but has been removed. ([#67](https://github.com/microsoft/vscode-azure-blockchain-ethereum/issues/67) by [@pinakighatak](https://github.com/pinakighatak))

### Fixes

### Internal Improvements

## 1.5.0

### Enhancements

### Fixes

- Fixed bug as a result of gas configuration changes to Azure Blockchain Service ([#54](https://github.com/microsoft/vscode-azure-blockchain-ethereum/issues/54) by [@rpajunen](https://github.com/rpajunen) and [@davew-msft](https://github.com/davew-msft) adn [@richross](https://github.com/richross))

### Internal Improvements

## 1.4.0

### Enhancements

### Fixes

- Updated API calls for webviews to using updated APIs ([#42](https://github.com/microsoft/vscode-azure-blockchain-ethereum/issues/42) by [@mjbvz](https://github.com/mjbvz))
- Bumped version of VS Code core to support to 1.44.1 and internal vscode type def (1.39.0)

### Internal Improvements

## 1.3.1

### Enhancements

- Updated README.md with changes for updated branding.
- Rebranding commands and UI elements.

### Fixes

### Internal Improvements

## 1.3.0

### Enhancements

- Add version 2.5 of OpenZeppelin contracts to the extension
- Added new code generator for logic apps
- Added new code generator for flow apps
- Adding initial code for decoupling frameworks from UI to support partner extensions better

### Fixes

- Fixed loader error for typescript in webpack (packaging error)
- Fixed some unit test issues

### Internal Improvements

- Improving package locks for specific core packages to help with stability

## 1.2.0

### Enhancements

- Add the ability to create new Blockchain Applications for Blockchain Data Manager
- Remove token menu and UI from extension
- Add changelog popup on extension upgrade

### Fixes

- Fix issue with broken code generation when using custom build directories
- Fix issue with OpenZeppelin contracts not showing as valid contracts for Blockchain Data Manager applications

### Internal Improvements

- Updates to telemetry for ABS deployments

## 1.1.0

### Enhancements

- Implement BDM core operations

### Fixes

- Fixed error when adding Mocks category from OpenZeppelin
- Removed unnecessary notifications when deploying to removed networks

### Internal Improvements

## 1.0.0

### Enhancements

- Added UI to handle required parameters for OpenZeppelin contract deployment.
- Added Blockchain Data Manager to the core view for connecting to existing instances.

### Fixes

- Cleanup of obfuscation for build directory path.
- Merge of public PR for url checker to include basic auth.

### Internal Improvements

- Refactoring custom build directory code.

## 0.1.13

### Enhancements

- Added progress notifications for long running tasks.
- Updated transaction bytecode copy option to support libraries and complex contracts.
- Added the ability to upgrade contracts deployed as part of OpenZeppelin.
- Added the ability for contract build redirects from configuration to be respected.

### Fixes

- Updated requirements for minimum VS Code version to 1.36.1. This was to resolve some issues specific to Mac OS.
- Updated notifications for code generation to be accurate for each type (logic app, flow app, function).

### Internal Improvements

- Test runner enhancements to fix some test issues (timing)
- Updated search tags for SEO

## 0.1.12

- Deployments from external truffle boxes can now deploy to Azure Blockchain Service
- Additional context menu for deployed contract bytecode (transaction bytecode)
- Fix on Mocks category for OpenZeppelin to remove the dead link for not existent docs
- Better handling of OpenZeppelin when multiple categories are downloaded.
- Fix misspelling of OpenZeppelin on the welcome page.

## 0.1.11

- Fixed issue with Logic App generation JSON schema
- Added Contract UI support for contracts deployed on Azure Blockchain Service
- Updated deprecated Truffle NPM packages
- Bumped HD wallet provider to latest Truffle version
- Minimized output channel logs
- Fixed output channel issue which shows JavaScript object after contract migration
- Preview features added for token (TTI compliant) generation were added.

## 0.1.10

- Fixed Drizzle error handling issues
- Updated Azure Blockchain Service logos in tree view
- Updated Azure Blockchain Development Kit logo
- Fixed unit tests for debugger, OpenZeppelin and Truffle commands
- Improved sign-in support for Infura projects

## 0.1.9

- Added support for Infura project integration and account management

## 0.1.8

- Added support for Open Zeppelin contract/library download and deployment
- Contract UI/Interaction functionality updates
  - Implement support for array types as function parameters
  - Support Enum types
- Bug fixes
  - Ganache not properly shutting down on VS Code exit
  - Closing open items raised in the extension VS Code public GitHub repo

## 0.1.7

- Added contract UI/interaction feature
- Added Solidity debugging feature

## 0.1.6

- Added telemetry reporting capabilities

## 0.1.5

- Backend test coverage
- Cleanup of packaging output, optimization
- Truffle installation fails on new installs fix
- Improved support for multiple ganache instances
- Preflight validation for ABS deployments
- Cleanup of code generation output
- Ganache commands cleanup
- Add command to export private key from mnemonic
- Better error handling ABS deployments

## 0.1.4

- bug fixes

## 0.1.3

- various bug fixes
- moved logic app/function/flow generators out of Truffle build directory into their own directory
- refactoring of Welcome/Requirements pages

## 0.1.2

- doc and bug fixes for contract code generation

## 0.1.1

- Updated menu options

## 0.1.0

- Initial release
