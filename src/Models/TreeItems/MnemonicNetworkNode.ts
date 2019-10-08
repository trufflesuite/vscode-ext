// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { saveTextInFile, showInputBox, showQuickPick, TruffleConfiguration } from '../../helpers';
import { MnemonicRepository } from '../../services/MnemonicRepository'; // Should be full path since cycle dependencies
import { NetworkNode } from './NetworkNode';

export abstract class MnemonicNetworkNode extends NetworkNode {
  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
    const config = new TruffleConfiguration.TruffleConfig(truffleConfigPath);
    const network = await super.getTruffleNetwork();
    const targetURL = await this.getRPCAddress();
    const mnemonic = await this.getMnemonic();

    await config.importPackage('fs', 'fs');

    network.options.provider = {
      mnemonic: mnemonic.path,
      url: `${targetURL}`,
    };

    return network;
  }

  private async getMnemonic(): Promise<{mnemonic: string, path: string}> {
    const mnemonicOptions = [
      {
        cmd: async () => {
          const mnemonic = await TruffleConfiguration.generateMnemonic();
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

    const savedMnemonics =  MnemonicRepository.getExistedMnemonicPaths()
      .map((path) => {
        const mnemonic = MnemonicRepository.getMnemonic(path);
        const label = MnemonicRepository.MaskMnemonic(mnemonic);
        return {
          cmd: async () => ({mnemonic, path}),
          detail: path,
          label,
        };
      });

    mnemonicOptions.push(...savedMnemonics);

    return await (await showQuickPick(
      mnemonicOptions,
      { placeHolder: Constants.placeholders.setupMnemonic, ignoreFocusOut: true })).cmd();
  }

  private async saveMnemonicFile(mnemonic: string): Promise<string> {
    const path = await saveTextInFile(
      mnemonic,
      '',
      { Files: [Constants.mnemonicConstants.fileExt]});
    MnemonicRepository.saveMnemonicPath(path);
    return path;
  }
}
