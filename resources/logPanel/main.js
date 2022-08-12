// @ts-ignore

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case 'addLog': {
        addLog(message.tool, message.log, message.description);
        break;
      }
      case 'getHistory': {
        getHistory();
        break;
      }
      case 'disposeTab': {
        disposeTab(message.tool, message.description);
        break;
      }
    }
  });

  function addLog(tool, log, description) {
    const tab = getTab(tool, description);

    // Create the log record
    const content = document.createElement('div');
    content.innerHTML = log;

    const contantContainer = document.querySelector(`[data-content="${tab.id}"]`);
    contantContainer.appendChild(content);
    contantContainer.scrollTop = contantContainer.scrollHeight;

    // Save the log state
    vscode.setState({log: document.getElementById('tab-container').innerHTML});
  }

  function getTab(tool, description) {
    const id = description ? `${tool}:${description}` : tool;
    const tab = document.querySelector(`[data-id="${id}"]`);

    if (tab) {
      return tab;
    } else {
      const availableTab = document.querySelector('[data-available="true"]');
      availableTab.dataset.id = id;
      availableTab.dataset.available = false;

      const label = document.querySelector(`[for="${availableTab.id}"]`);
      const virtualPath = document.getElementById('virtualPath').value;
      const icon = `<img src="${virtualPath}/images/${tool}-log.png">`;
      const title = `<span>${description ? `${tool} :${description}` : tool}</span>`;
      label.innerHTML = `${icon} ${title}`;
      label.style.display = 'block';

      return availableTab;
    }
  }

  function getHistory() {
    const state = vscode.getState();
    if (state.log !== '') document.getElementById('tab-container').innerHTML = state.log;
  }

  function disposeTab(tool, description) {
    const tab = getTab(tool, description);
    tab.dataset.id = '';
    tab.dataset.available = true;

    const label = document.querySelector(`[for="${tab.id}"]`);
    label.innerHTML = '';
    label.style.display = 'none';

    const contentContainer = document.querySelector(`[data-content="${tab.id}"]`);
    contentContainer.innerHTML = '';

    const tabFocus = document.querySelector('[data-available="false"]');
    tabFocus.checked = true;

    // Save the log state
    vscode.setState({log: document.getElementById('tab-container').innerHTML});
  }
})();
