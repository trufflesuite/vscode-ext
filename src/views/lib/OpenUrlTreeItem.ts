import {env, ThemeIcon, TreeItem, Uri, window} from 'vscode';

export class OpenUrlTreeItem extends TreeItem {
  public constructor(label: string, private readonly url: string | undefined, iconPath?: string) {
    super(label);
    (this.command = {title: '', command: 'truffle-vscode.openUrl', arguments: [this]}),
      (this.iconPath = new ThemeIcon(iconPath ?? 'globe'));
  }

  public async openUrl(): Promise<void> {
    if (this.url) {
      await env.openExternal(Uri.parse(this.url));
    } else {
      window.showWarningMessage(`URL was blank for item: ${this.label}`);
    }
  }
}
