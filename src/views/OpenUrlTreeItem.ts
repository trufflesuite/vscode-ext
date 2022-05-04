import * as vscode from "vscode";
import {AzExtParentTreeItem, GenericTreeItem} from "@microsoft/vscode-azext-utils";

export class OpenUrlTreeItem extends GenericTreeItem {
  private _url: string;

  public constructor(parent: AzExtParentTreeItem, label: string, url: string, iconPath?: vscode.ThemeIcon) {
    super(parent, {
      commandId: "truffle-vscode.openUrl",
      contextValue: "openUrl",
      iconPath: iconPath ?? new vscode.ThemeIcon("globe"),
      includeInTreeItemPicker: true,
      label,
    });
    this._url = url;
  }

  public async openUrl(): Promise<void> {
    await vscode.env.openExternal(vscode.Uri.parse(this._url));
  }
}
