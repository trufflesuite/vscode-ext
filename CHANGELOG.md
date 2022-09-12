# Change Log

All notable changes to the "Truffle for VSCode" extension will be documented in this file.

## 2.5.0 - _Haiku_ 😈

This release has improved support to debug over a forked network and working with multiple Truffle projects in the same workspace.
The brand new Walkthrough helps users to explore and discover the main features of the extension.
Moreover, it has some bug fixes, internal optimisations, and code refactor for better maintainability.

Give it a try and let us know what you think!

### What's Changed

- Ability to debug over a forked network [\#186](https://github.com/trufflesuite/vscode-ext/pull/186) ([xhulz](https://github.com/xhulz))
- Use `contracts_directory` from Truffle config in `Create Contract` command [\#193](https://github.com/trufflesuite/vscode-ext/pull/193) ([acuarica](https://github.com/acuarica))
- Fix Command Palette display filter for Build/Deploy/Create Contracts commands [\#192](https://github.com/trufflesuite/vscode-ext/pull/192) ([acuarica](https://github.com/acuarica))
- Add support to run out tests without VS Code Development Extension Host [\#191](https://github.com/trufflesuite/vscode-ext/pull/191) ([acuarica](https://github.com/acuarica))
- Add support for multiple Truffle config files [\#181](https://github.com/trufflesuite/vscode-ext/pull/181) ([acuarica](https://github.com/acuarica))
- Honor the `contract_build_directory` property in Deployments view [\#179](https://github.com/trufflesuite/vscode-ext/pull/179) ([acuarica](https://github.com/acuarica))
- Ability to compile a single contract [\#177](https://github.com/trufflesuite/vscode-ext/pull/177) ([xhulz](https://github.com/xhulz))
- Dashboard link has added to dashboard view panel [\#172](https://github.com/trufflesuite/vscode-ext/pull/172) ([xhulz](https://github.com/xhulz))
- Debug only works with Ganache Development Instance [\#170](https://github.com/trufflesuite/vscode-ext/pull/170) ([xhulz](https://github.com/xhulz))
- Add a Walkthrough on the Getting Started splash [\#148](https://github.com/trufflesuite/vscode-ext/pull/148) ([acuarica](https://github.com/acuarica))
- Replace `open` package with `vscode.env.openExternal` [\#195](https://github.com/trufflesuite/vscode-ext/pull/195) ([acuarica](https://github.com/acuarica))
- Always use the embedded Debug Adapter [\#218](https://github.com/trufflesuite/vscode-ext/pull/218) ([acuarica](https://github.com/acuarica))

## 2.4.0 - _Goblins_ 😈

This release has some fixes around internal optimisations for our CI/Linting and cleanup of code where we were seeing issues with building contracts in mono repos etc.

We also added some new Truffle Dashboard integration/view. Give it a try and let us know what you think!

### What's Changed

- Fix/debug workspace by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/116
- Feature/eslint config changes by @michaeljohnbennett in https://github.com/trufflesuite/vscode-ext/pull/118
- issue #121, renamed "explorer - truffle "to "contract explorer" by @NikolaiSch in https://github.com/trufflesuite/vscode-ext/pull/122
- Edit the required apps page to display the version range of all apps by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/120
- Feature/eslint fixes - Part2 - Config cleanup for truffle configuration by @michaeljohnbennett in https://github.com/trufflesuite/vscode-ext/pull/119
- fix: added new PR checks by @michaeljohnbennett in https://github.com/trufflesuite/vscode-ext/pull/126
- fix: hdwallet npm package has updated to truffle/hdwallet-provider by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/127
- feat(explorer): added createContract by @NikolaiSch in https://github.com/trufflesuite/vscode-ext/pull/123
- Improve Truffle Dashboard deployment integration by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/114
- fix: auto load has implemented by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/136
- refactor: remove unused code that checks whether Python is installed by @acuarica in https://github.com/trufflesuite/vscode-ext/pull/139
- fix: start ganache command when invoked from the command palette by @acuarica in https://github.com/trufflesuite/vscode-ext/pull/142
- fix: activationEvents list commands has reverted by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/167
- fix: contract deployment is not forking networks by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/146
- Draft: Required app was validating NPM local packages by @xhulz in https://github.com/trufflesuite/vscode-ext/pull/164

### New Contributors

- @acuarica made their first contribution in https://github.com/trufflesuite/vscode-ext/pull/139

**Full Changelog**: https://github.com/trufflesuite/vscode-ext/compare/v2.3.4...V2.4.0

## 2.3.4

This release is a fix to the windows path issues that were reported.

- fix: Build/Deploy commands were not working with mapping volumes on Windows 11 [PR](https://github.com/trufflesuite/vscode-ext/pull/110). The issue was found on windows 11 platform only. It was related to volume mapping. If the user open a project in root (C:), the build/deploy commands are working fine. But, if the project is opened in a mapping volume, the problem occurred. A fix was made and applied for windows platforms only.

## 2.3.3

Welcome to the new look Changelog. We will add more info against each release where we think it will add value and inform you of what new cool features we are creating or paving the way for. This month we did a bunch of protoyping and internal features/improvements for viewing your projects, layer 1/2 support via Infura and forking made simple for Ganache from the UI.

- Infura network has been divided into Layer 1/2. Infura will soon be offering a way to group our networkys by layer, this adds support for that in our network views. [PR](https://github.com/trufflesuite/vscode-ext/pull/86)
- Generic Service added to list of services. This is an internal fix to pave the way for other blockchain (permissioned/private) support. [PR](https://github.com/trufflesuite/vscode-ext/pull/85)
- Infura network has been divided into Layer 1/2 [PR](https://github.com/trufflesuite/vscode-ext/pull/86)
- Handling builds and compiles from within projects in subdirectories [PR](https://github.com/trufflesuite/vscode-ext/pull/82)
- Updating our README.md [PR](https://github.com/trufflesuite/vscode-ext/pull/78)
- New Truffle view added to VSCode on left hand bar. This is a prototype where you can see your contracts, deployments and some help links. We hope to expand this and add new features, so please let us know if this works for you and how we can make it better. [PR](https://github.com/trufflesuite/vscode-ext/pull/75)
  - Right now we do have a few caveats with this, not all the features of the main explorer are possible in the explorer view we are working with, you can call build contracts but there are buttons at the top to deploy and build also.
  - We are working on the basis of single repos (not monorepos of multiple truffle projects) so we are going to be releasing fixes for that in the future.
- fix: Preventing possible bug on required apps [PR](https://github.com/trufflesuite/vscode-ext/pull/71). There are times when the required apps check can sometimes happen twice internally causing this error to say you have not got all the required apps installed correctly. This fixes that issue. 🤞🏻
- Forked ganache instance [PR](https://github.com/trufflesuite/vscode-ext/pull/70). Fork your blockchains, just like on the command line. Through a set of dialogs you can now fork any network via Infura at a specific block or latest and this will now configure that and have it visible in your network list.
- fix: Build/Deploy commands were not working with mapping volumes on Windows 11 [PR](https://github.com/trufflesuite/vscode-ext/pull/110). The issue was found on windows 11 platform only. It was related to volume mapping. If the user open a project in root (C:), the build/deploy commands are working fine. But, if the project is opened in a mapping volume, the problem occurred. A fix was made and applied for windows platforms only.

Most of these are great enhancements to our codebase and thank you to all the contributors!

## 2.2.3

- Required apps validation has fixed.
- Ganache commands, has added to extension initialization.

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
