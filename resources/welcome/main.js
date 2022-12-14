document.addEventListener('DOMContentLoaded', function () {
  const vscode = acquireVsCodeApi();

  document.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', (e) => {
      vscode.postMessage(a.href ? {command: 'openLink', value: a.href} : {command: 'executeCommand', value: a.id});

      if (a.classList.contains('action')) {
        a.closest('.required-app').classList.toggle('disabled');
      }
    });
  });

  document.querySelector('#showOnStartup').addEventListener('change', function () {
    vscode.postMessage({command: 'toggleShowPage', value: this.checked});
  });

  window.addEventListener('message', function (event) {
    const message = event.data; // The JSON data our extension sent
    if (message.command === 'versions') {
      const versions = message.value;
      if (Array.isArray(versions)) {
        versions.forEach((version) => {
          const element = document.querySelector(`#${version.app}`);
          const spinner = document.querySelector(`#${version.app} .spinner`);
          element.classList.toggle('disabled', version.isValid);
          spinner.classList.toggle('spinner', false);
        });
      }
    } else if (message.command === 'showOnStartup') {
      if (!!message.value) {
        document.querySelector('#showOnStartup').setAttribute('checked', '');
      } else {
        document.querySelector('#showOnStartup').removeAttribute('checked');
      }
    }
  });

  vscode.postMessage({command: 'documentReady'});
});
