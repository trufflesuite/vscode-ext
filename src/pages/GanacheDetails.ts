import * as vscode from 'vscode';

class GanacheDetails {
  public static readonly viewType = 'truffle-vscode.ganache.details';
  private _view: vscode.WebviewPanel;
  private _extensionUri: vscode.Uri;

  constructor(context: vscode.ExtensionContext) {
    this._view = vscode.window.createWebviewPanel(
      'catCoding', // Identifies the type of the webview. Used internally
      'Cat Coding', // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );

    this._extensionUri = context.extensionUri;

    console.log(this._view);
    console.log(this._extensionUri);
  }
}

export async function registerGanacheDetails(context: vscode.ExtensionContext): Promise<void> {
  const ganache = new GanacheDetails(context);
  console.log(ganache);
}
