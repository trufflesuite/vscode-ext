import {AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext} from "@microsoft/vscode-azext-utils";
import {ThemeIcon} from "vscode";
import {OpenUrlTreeItem} from "./OpenUrlTreeItem";

export class HelpTreeItem extends AzExtParentTreeItem {
  public label: string = "help";
  public contextValue: string = "help";

  private declare values: GenericTreeItem[];

  public async loadMoreChildrenImpl(_clear: boolean, _ctx: IActionContext): Promise<AzExtTreeItem[]> {
    return this.values ?? (this.values = [this.readDocumentationTreeItem]);
  }
  public hasMoreChildrenImpl(): boolean {
    return false;
  }

  private get readDocumentationTreeItem(): AzExtTreeItem {
    const node = new OpenUrlTreeItem(
      this,
      "Read Extension Documentation",
      "https://trufflesuite.com/docs/vscode-ext/",
      new ThemeIcon("book")
    );
    node.id = "0";

    return node;
  }
}
