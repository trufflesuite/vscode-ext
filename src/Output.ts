// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {createAzExtOutputChannel, IAzExtOutputChannel} from "@microsoft/vscode-azext-utils";
import {ext, Constants} from "./Constants";

export class Output {
  public static output(label: string, message: string): void {
    this._outputChannel.append(this.formatMessage(label, message));
  }

  public static outputLine(label: string, message: string): void {
    this._outputChannel.appendLine(this.formatMessage(label, message));
  }

  public static show(): void {
    this._outputChannel.show();
  }

  public static hide(): void {
    this._outputChannel.hide();
  }

  public static dispose(): void {
    this._outputChannel.dispose();
  }

  private static _outputChannel: IAzExtOutputChannel = createAzExtOutputChannel(
    Constants.outputChannel.truffleForVSCode,
    ext.prefix
  );

  private static formatMessage(label: string = "", message: string = ""): string {
    return `${label ? `[${label}] ` : ""}${message}`;
  }

  /**
   * Call this only once to push the outputChannel into the list of subscriptions.
   */
  public static subscribe(): IAzExtOutputChannel {
    ext.context.subscriptions.push(this._outputChannel);
    return this._outputChannel;
  }
}
