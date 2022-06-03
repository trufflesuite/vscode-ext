// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, TreeItem, TreeItemCollapsibleState, Uri} from "vscode";
import {Constants} from "../../Constants";
import {Telemetry} from "../../TelemetryClient";
import {ItemType} from "../ItemType";
import {IExtensionItem} from "./IExtensionItem";
import Timeout = NodeJS.Timeout;

export interface ExtensionItemData {
  iconPath?: {light: string | Uri; dark: string | Uri};
  contextValue?: string;
}

export abstract class ExtensionItem extends TreeItem implements IExtensionItem {
  protected static timeoutID: NodeJS.Timeout | undefined;
  protected children: IExtensionItem[];
  protected parent: IExtensionItem | null;

  protected constructor(
    public readonly itemType: ItemType,
    public readonly label: string,
    public readonly data: ExtensionItemData,
    public description?: string
  ) {
    super(label);

    this.contextValue = data.contextValue;
    this.iconPath = data.iconPath;
    this.description = description;
    this.tooltip = description;

    this.children = [];
    this.parent = null;
  }

  public getParent(): IExtensionItem | null {
    return this.parent;
  }

  public getChildren(): IExtensionItem[] {
    return this.children;
  }

  public addParent(parent: IExtensionItem): void {
    this.parent = parent;
  }

  public addChild(child: IExtensionItem): void {
    if (this.children.some((_child) => _child.label === child.label)) {
      Telemetry.sendException(
        new Error(
          Constants.errorMessageStrings.GetMessageChildAlreadyConnected(
            Telemetry.obfuscate(child.label?.toString() || "")
          )
        )
      );
      throw new Error(Constants.errorMessageStrings.GetMessageChildAlreadyConnected(child.label?.toString() || ""));
    }

    child.addParent(this);
    this.children.push(child);

    this.collapse();
    this.refreshTree();
  }

  public removeChild(child: IExtensionItem): void {
    this.children = this.children.filter((_child) => _child !== child);

    this.collapse();
    this.refreshTree();
  }

  public setChildren(children: IExtensionItem[]): void {
    this.children = children;
    this.children.forEach((child) => child.addParent(this));

    this.collapse();
    this.refreshTree();
  }

  public toJSON(): {[key: string]: any} {
    return {
      children: this.children,
      description: this.description,
      itemType: this.itemType,
      label: this.label,
    };
  }

  private collapse(): void {
    if (this.children.length > 0) {
      Telemetry.sendEvent("ExtensionItem.collapse.childrenLengthGreaterThanZero");
      this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    } else {
      this.collapsibleState = TreeItemCollapsibleState.None;
    }
  }

  private refreshTree(): void {
    clearTimeout(ExtensionItem.timeoutID as Timeout);
    ExtensionItem.timeoutID = setTimeout(async () => {
      try {
        await commands.executeCommand("truffle-vscode.refresh");
      } catch (error) {
        Telemetry.sendException(error as Error);
      }
    }, 300);
  }
}
