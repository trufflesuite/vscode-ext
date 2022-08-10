// @ts-ignore

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  getLog();

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case 'addLog': {
        addLog(message.tool, message.log, message.options);
        break;
      }
      case 'clearState': {
        clearState();
        break;
      }
    }
  });

  function addLog(tool, log, options) {
    const tab = document.getElementById(`tab-${tool}`);

    console.log('aqui');
    // Check if the tab exists
    if (tab === null) createTab(tool);

    // Create the log record
    const contentLine = document.createElement('div');
    contentLine.innerHTML = log;

    // Add the line to the content
    const content = document.getElementById(`content-${tool}`);
    content.appendChild(contentLine);

    // Save the log state
    vscode.setState({log: document.getElementById('tab-container').innerHTML});
  }

  function createTab(tool) {
    // Set the tab title
    const html = `<img src="{{root}}/images/truffle.png" /><span>Truffle</span>`;

    // Create the tab element
    const tab = document.createElement('div');
    tab.id = `tab-${tool}`;
    tab.dataset.tool = tool;
    tab.innerHTML = html;

    // Add the tab element to tab container
    const tabs = document.getElementById('tab-collection');
    tabs.appendChild(tab);

    // Create the content element
    const content = document.createElement('div');
    content.id = `content-${tool}`;
    content.dataset.tool = tool;

    // Add the content element to content container
    const contents = document.getElementById('tab-content-collection');
    contents.appendChild(content);
  }

  function getLog() {
    const state = vscode.getState() || {log: []};
    document.getElementById('tab-container').innerHTML = state.log;
  }

  function clearState() {
    document.getElementById('tab-collection').innerHTML = '';
    document.getElementById('tab-content-collection').innerHTML = '';
    vscode.setState({log: ''});
  }
})();
