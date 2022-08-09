// @ts-ignore

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  getLog();

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'addLog': {
        addLog(message.log, message.uri);
        break;
      }
      case 'clearState': {
        clearState();
        break;
      }
    }
  });

  function addLog(log, uri) {
    const html = `<div style="width: 100%; min-height: 22px">
        <div style="display: inline-block; float: left;">
            <img src='${uri}/TruffleLogo.svg' width='14px' height='14px' style="margin-top: 2px" />
        </div>
        <div style="display: inline-block; padding-left: 4px; width: 95%; font-family: 'Courier New'; font-size: 14px;">
            ${log}
        </div>
    </div>`;

    const htmlContainer = document.createElement('div');
    htmlContainer.innerHTML = html;

    const logContainer = document.getElementById('log-container');
    logContainer.appendChild(htmlContainer);

    vscode.setState({log: logContainer.innerHTML});
  }

  function getLog() {
    const oldState = vscode.getState();
    document.getElementById('log-container').innerHTML = oldState.log;
  }

  function clearState() {
    document.getElementById('log-container').innerHTML = '';
    vscode.setState({log: ''});
  }
})();
