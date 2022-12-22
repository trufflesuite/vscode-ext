// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INetwork} from '@/helpers/ConfigurationReader';
import {generateMnemonic, getTruffleConfigUri, TruffleConfig} from '@/helpers/TruffleConfiguration';
import {window} from 'vscode';
import {Constants, RequiredApps} from '@/Constants';
import {showInputBox, showQuickPick, saveTextInFile} from '@/helpers/userInteraction';
import {MnemonicRepository} from '@/services/MnemonicRepository'; // Should be full path since cycle dependencies
import {Telemetry} from '@/Telemetry';
import {NetworkNode} from './NetworkNode';

export abstract class MnemonicNetworkNode extends NetworkNode {
  public async getTruffleNetwork(): Promise<INetwork> {
    const truffleConfigPath = getTruffleConfigUri();
    const config = new TruffleConfig(truffleConfigPath);
    const network = await super.getTruffleNetwork();
    const mnemonic = await this.getMnemonic();
    const {fs, fsPackageName, hdwalletProvider} = Constants.truffleConfigRequireNames;
    config.importPackage(fs, fsPackageName);
    config.importPackage(hdwalletProvider, RequiredApps.hdwalletProvider);

    let targetURL = '';
    try {
      targetURL = await this.getRPCAddress();

      if (!targetURL) {
        void window.showInformationMessage(Constants.informationMessage.networkIsNotReady(this.constructor.name));
      }
    } catch (error) {
      Telemetry.sendException(error as Error);
    }

    network.options.provider = {
      mnemonic: mnemonic.path,
      url: `${targetURL}`,
    };

    return network;
  }

  private async getMnemonic(): Promise<{mnemonic: string; path: string}> {
    const mnemonicOptions = [
      {
        cmd: async () => {
          const mnemonic = generateMnemonic();
          const path = await this.saveMnemonicFile(mnemonic);
          return {mnemonic, path};
        },
        label: Constants.placeholders.generateMnemonic,
      },
      {
        cmd: async () => {
          const mnemonic = await showInputBox({
            ignoreFocusOut: true,
            placeHolder: Constants.placeholders.pasteMnemonic,
          });
          const path = await this.saveMnemonicFile(mnemonic);
          return {mnemonic, path};
        },
        label: Constants.placeholders.pasteMnemonic,
      },
    ];

    const savedMnemonics = MnemonicRepository.getExistedMnemonicPaths().map((path) => {
      const mnemonic = MnemonicRepository.getMnemonic(path);
      const label = MnemonicRepository.MaskMnemonic(mnemonic);
      return {
        cmd: async () => ({mnemonic, path}),
        detail: path,
        label,
      };
    });

    mnemonicOptions.push(...savedMnemonics);

    return await (
      await showQuickPick(mnemonicOptions, {placeHolder: Constants.placeholders.setupMnemonic, ignoreFocusOut: true})
    ).cmd();
  }

  private async saveMnemonicFile(mnemonic: string): Promise<string> {
    const path = await saveTextInFile(mnemonic, '', {Files: [Constants.mnemonicConstants.fileExt]});
    MnemonicRepository.saveMnemonicPath(path);
    return path;
  }
}
