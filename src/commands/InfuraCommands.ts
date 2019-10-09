// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { window } from 'vscode';
import { Constants } from '../Constants';
import { showConfirmDialog } from '../helpers';
import { InfuraServiceClient } from '../services';

export namespace InfuraCommands {
  export async function signIn(): Promise<void> {

    await InfuraServiceClient.signIn();

    window.showInformationMessage(Constants.informationMessage.infuraSignIn);
  }

  export async function signOut(): Promise<void> {
    const answer = await showConfirmDialog('sign out of Infura account', 'stay sign in');

    if (answer === Constants.confirmationDialogResult.yes) {
      await InfuraServiceClient.signOut();

      window.showInformationMessage(Constants.informationMessage.infuraSignOut);
    }
  }
}
