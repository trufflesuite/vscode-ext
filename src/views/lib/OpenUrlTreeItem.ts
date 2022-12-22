import {env, ThemeIcon, TreeItem, Uri, window} from 'vscode';

/**
 * This class enhances the `TreeItem` to support links when selected.
 */
export class OpenUrlTreeItem extends TreeItem {
  /**
   * Creates a new `OpenUrlTreeItem `.
   *
   * @param label the visible label of this `TreeItem`.
   * @param url the URL to open when this `TreeItem` is selected.
   * @param iconPath the icon path id to use for this `TreeItem`.
   */
  constructor(label: string, private readonly url: string | undefined, iconPath?: string) {
    super(label);
    this.command = {title: '', command: 'truffle-vscode.openUrl', arguments: [this]};
    this.iconPath = new ThemeIcon(iconPath ?? 'globe');
  }

  /**
   * Opens `url` externally using the default application.
   */
  public async openUrl(): Promise<void> {
    if (this.url) {
      await env.openExternal(Uri.parse(this.url));
    } else {
      void window.showWarningMessage(`URL was blank for item: ${this.label}`);
    }
  }
}
