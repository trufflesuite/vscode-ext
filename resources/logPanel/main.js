const logView = {
  config: {
    state: acquireVsCodeApi(),
    virtualPath: document.getElementById('virtualPath').value,
  },
  log: {
    create: (tool, message, description) => {
      // Retrieve the tab that belongs to the tool
      const tab = logView.tab.get(tool, description);

      // Create the content
      logView.content.create(tab, message);

      // Save the log state
      logView.config.state.setState({log: document.getElementById('tab-container').innerHTML});
    },
    history: () => {
      // Retrieve the history of content recorded in state
      const state = logView.config.state.getState();
      if (state.log !== '') document.getElementById('tab-container').innerHTML = state.log;
    },
  },
  tab: {
    get: (tool, description) => {
      // Retrieve the tab that belongs to the tool
      const id = description ? `${tool}:${description}` : tool;
      const tab = document.querySelector(`[data-id="${id}"]`);

      // If the tab exists, it returns its instance, otherwise it looks for a new available tab
      return tab ? tab : logView.tab.set(tool, id);
    },
    set: (tool, id) => {
      // Retrieve the next available tab
      const tab = document.querySelector('[data-available="true"]');
      tab.dataset.id = id;
      tab.dataset.available = false;

      // Set the tab configuration data: icon & title
      const label = document.querySelector(`[for="${tab.id}"]`);
      const icon = `<img src="${logView.config.virtualPath}/images/${tool}-log.png">`;
      const title = `<span>${id}</span>`;
      label.innerHTML = `${icon} ${title}`;
      label.style.display = 'block';

      return tab;
    },
    dispose: (tool, description) => {
      // Retrieve the tab and reset it
      const tab = logView.tab.get(tool, description);
      tab.dataset.id = '';
      tab.dataset.available = true;

      const label = document.querySelector(`[for="${tab.id}"]`);
      label.innerHTML = '';
      label.style.display = 'none';

      // Retrieve the content container and reset it
      const content = document.querySelector(`[data-content="${tab.id}"]`);
      content.innerHTML = '';

      // Set the focus to the previous tab
      const tabFocus = document.querySelector('[data-available="false"]');
      tabFocus.checked = true;

      // Save the log state
      logView.config.state.setState({log: document.getElementById('tab-container').innerHTML});
    },
  },
  content: {
    create: (tab, message) => {
      // Create the content node
      const node = document.createElement('div');
      node.innerHTML = message;

      // Retrieve content container according to tab and insert the new content
      const content = document.querySelector(`[data-content="${tab.id}"]`);
      content.appendChild(node);
      content.scrollTop = content.scrollHeight;
    },
  },
};

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
  const data = event.data; // The json data that the extension sent
  switch (data.command) {
    case 'create.log': {
      // Create the new log register
      logView.log.create(data.tool, data.message, data.description);
      break;
    }
    case 'get.history': {
      // Retrieve the log history
      logView.log.history();
      break;
    }
    case 'dispose.tab': {
      // Dispose the chosen tab
      logView.tab.dispose(data.tool, data.description);
      break;
    }
  }
});
