// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {getWorkspaceForUri, WorkspaceType} from '@/helpers/AbstractWorkspace';
import {Output, OutputLabel} from '@/Output';

import {
  HardHatExtensionAdapter,
  IExtensionAdapter,
  TruffleExtensionAdapter,
  UnknownExtensionAdapter,
} from '@/services/extensionAdapter';
import {Uri, window} from 'vscode';

class SdkCoreCommands {
  private extensionAdapters = new Map<string, IExtensionAdapter>();

  public getExtensionAdapter(sdkVal: WorkspaceType): IExtensionAdapter | undefined {
    if (this.extensionAdapters.has(sdkVal)) {
      return this.extensionAdapters.get(sdkVal);
    }
    // let's initialise it otherwise
    const adapter = this.initExtensionAdapter(sdkVal);
    // console.log(`getExtensionAdapter: `, {adapter, sdkVal});
    adapter.validateExtension().then(
      (_) => {
        Output.outputLine(
          OutputLabel.sdkCoreCommands,
          `Configuration Initialized. SdkCoreProvider: ${adapter.constructor.name}`
        );
      },
      (error) => {
        window.showErrorMessage(error.message);
      }
    );
    this.extensionAdapters.set(sdkVal, adapter);
    return adapter;
  }

  /**
   * Triggers the build process to compile smart contracts.
   *
   * @param contractUri if provided, it is the `Uri` of the smart contract to be compiled.
   */
  public async build(contractUri?: Uri): Promise<void> {
    const ws = await getWorkspaceForUri(contractUri);
    const buildUri = contractUri ? contractUri : ws.workspace;
    const adapter = await this.getExtensionAdapter(ws.workspaceType);
    console.debug(`build:debug::`, {ws, buildUri, adapter});
    return adapter!.build(ws, buildUri);
  }

  /**
   * Deploys, _i.e._, `migrate`, smart contracts into a Network.
   *
   * @param contractUri FIXME: Is this used?
   */
  public async deploy(contractUri?: Uri): Promise<void> {
    const ws = await getWorkspaceForUri(contractUri);
    const deployUri = contractUri ? contractUri : ws.workspace;
    const adapter = await this.getExtensionAdapter(ws.workspaceType);
    return adapter!.deploy(ws, deployUri);
  }

  private initExtensionAdapter(sdk: WorkspaceType): IExtensionAdapter {
    switch (sdk) {
      case WorkspaceType.HARDHAT:
        return new HardHatExtensionAdapter();
      case WorkspaceType.TRUFFLE:
        return new TruffleExtensionAdapter();
      default:
        return new UnknownExtensionAdapter();
    }
  }
}

export const sdkCoreCommands = new SdkCoreCommands();
