// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {buildContracts} from '@/commands/HardhatCommands';
import {NotificationOptions} from '@/Constants';
import {showNotification} from '@/helpers/userInteraction';
import {AbstractWorkspaceManager} from '@/helpers/workspace';
import {IExtensionAdapter} from '@/services/extensionAdapter/IExtensionAdapter';
import {Constants} from '@/constants';
import {Uri} from 'vscode';
import WorkspaceType = AbstractWorkspaceManager.WorkspaceType;

export class HardHatExtensionAdapter implements IExtensionAdapter {
  build(workspace?: AbstractWorkspaceManager.AbstractWorkspace, contractUri?: Uri): Promise<void> {
    return buildContracts(workspace, contractUri);
  }

  async deploy(_uri?: Uri): Promise<void> {
    await showNotification({
      message: Constants.errorMessageStrings.HHNoDefaultDeploy,
      type: NotificationOptions.error,
    });
  }

  async validateExtension(): Promise<void> {
    return Promise.resolve(undefined);
  }

  extensionType: AbstractWorkspaceManager.WorkspaceType = WorkspaceType.HARDHAT;
}
