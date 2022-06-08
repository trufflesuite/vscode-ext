import * as vscode from "vscode";
import {AzExtParentTreeItem, GenericTreeItem} from "@microsoft/vscode-azext-utils";

export class OpenUrlTreeItem extends GenericTreeItem {
  public constructor(
    parent: AzExtParentTreeItem,
    id: string,
    label: string,
    private readonly url: string | undefined,
    iconPath?: vscode.ThemeIcon
  ) {
    super(parent, {
      id,
      commandId: "truffle-vscode.openUrl",
      contextValue: "openUrl",
      iconPath: iconPath ?? new vscode.ThemeIcon("globe"),
      includeInTreeItemPicker: true,
      label,
    });
  }

  public async openUrl(): Promise<void> {
    if (this.url) {
      await vscode.env.openExternal(vscode.Uri.parse(this.url));
    } else {
      vscode.window.showWarningMessage(`URL was blank for item: ${this.label}`);
    }
  }
}
