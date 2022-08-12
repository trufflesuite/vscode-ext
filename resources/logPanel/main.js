const logPanel = {
  vscode: acquireVsCodeApi(),
  create: {
    log: (tool, message, description) => {
      const tab = logPanel.get.tab(tool, description);

      // Create the log record
      const content = document.createElement('div');
      content.innerHTML = message;

      const contantContainer = document.querySelector(`[data-content="${tab.id}"]`);
      contantContainer.appendChild(content);
      contantContainer.scrollTop = contantContainer.scrollHeight;

      // Save the log state
      logPanel.vscode.setState({log: document.getElementById('tab-container').innerHTML});
    },
  },
  get: {
    tab: (tool, description) => {
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
    },
    history: () => {
      const state = logPanel.vscode.getState();
      if (state.log !== '') document.getElementById('tab-container').innerHTML = state.log;
    },
  },
  dispose: {
    tab: (tool, description) => {
      const tab = logPanel.get.tab(tool, description);
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
      logPanel.vscode.setState({log: document.getElementById('tab-container').innerHTML});
    },
  },
};

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
  const data = event.data; // The json data that the extension sent
  switch (data.command) {
    case 'create.log': {
      logPanel.create.log(data.tool, data.message, data.description);
      break;
    }
    case 'get.history': {
      logPanel.get.history();
      break;
    }
    case 'dispose.tab': {
      logPanel.dispose.tab(data.tool, data.description);
      break;
    }
  }
});
