import {AzExtParentTreeItem, GenericTreeItem, IGenericTreeItemOptions} from "@microsoft/vscode-azext-utils";

type OpenFileTreeItemOptions = IGenericTreeItemOptions & {
  commandArgs: any[] | undefined;
};

// Extension for Generic Tree Item to be a useful little tree item.
export class OpenFileTreeItem extends GenericTreeItem {
  constructor(parent: AzExtParentTreeItem, options: OpenFileTreeItemOptions) {
    super(parent, options);
    this.commandArgs = options.commandArgs;
  }
}
