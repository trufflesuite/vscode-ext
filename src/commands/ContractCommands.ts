// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {StatusBarItems} from '@/Models/StatusBarItems/Contract';

export namespace ContractCommands {
  /**
   * This function is responsible for enabling or disabling the automatic deployment of contracts
   *
   * @param contractStatusBarItem The object representing the status bar contract item.
   */
  export function setEnableOrDisableAutoDeploy(contractStatusBarItem: StatusBarItems.Contract): void {
    // Gets the current auto deploy current state and invert its value
    const enableOrDisableAutoDeploy = contractStatusBarItem.getState() ? false : true;

    // Set the new state value
    contractStatusBarItem.setState(enableOrDisableAutoDeploy);
  }
}
