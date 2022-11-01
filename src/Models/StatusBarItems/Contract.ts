// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {Memento, StatusBarAlignment, StatusBarItem, window} from 'vscode';

export namespace StatusBarItems {
  export class Contract {
    /**
     * The status bar item object.
     */
    private _statusBar: StatusBarItem;

    /**
     * Starts the status bar item.
     *
     * @param _globalState A memento represents a storage utility. It can store and retrieve values.
     */
    constructor(private readonly _globalState: Memento) {
      this._statusBar = window.createStatusBarItem(StatusBarAlignment.Left);

      this.bind();
    }

    /**
     * This method is responsible for loading status bar item settings as well as checking the current state.
     */
    private bind(): void {
      // Gets the current state (enebled or disabled)
      const isEnabled = this.getState();

      // Sets the status bar item configuration
      this._statusBar.text = this.getText(isEnabled);
      this._statusBar.command = Constants.contract.configuration.statusBar.command;
      this._statusBar.tooltip = Constants.contract.configuration.statusBar.tooltip;
      this._statusBar.show();
    }

    /**
     * This function is responsible for returning the text that should be displayed in the status bar item.
     *
     * @param isEnabled The flag that indicates whether the text should display the label for enabled or disabled.
     * @returns The chosen text.
     */
    private getText(isEnabled: boolean): string {
      // Returns the status bar label according to the flag value
      return isEnabled
        ? Constants.contract.configuration.statusBar.text.enabled
        : Constants.contract.configuration.statusBar.text.disabled;
    }

    /**
     * This function is responsible for updating the current status of the status bar item.
     *
     * @param isEnabled The flag that indicates whether auto deploy should be enabled or disabled.
     */
    private updateState(isEnabled: boolean): void {
      // Updates the state
      this._globalState.update(Constants.globalStateKeys.contractAutoDeployOnSave, isEnabled);
    }

    /**
     * This function is responsible for returning the current status of the status bar item.
     * Whether automatic deployment is enabled or disabled.
     *
     * @returns The state value for enabled / disabled.
     */
    public getState(): boolean {
      // Gets the current state
      return this._globalState.get<boolean>(Constants.globalStateKeys.contractAutoDeployOnSave) || false;
    }

    /**
     * This function is responsible for setting the current status of the status bar item,
     * its correct label as well as updating the state.
     *
     * @param isEnabled The flag that indicates whether auto deploy should be enabled or disabled.
     */
    public setState(isEnabled: boolean): void {
      // Gets the status bar label according to the flag value
      this._statusBar.text = this.getText(isEnabled);

      // Updates the state
      this.updateState(isEnabled);
    }
  }
}
