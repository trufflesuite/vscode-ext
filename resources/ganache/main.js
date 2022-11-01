// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

const ganacheDetails = {
  config: {
    vscode: acquireVsCodeApi(),
  },
  actions: {
    set: () => {
      // Gets the refresh button instance
      const button = document.getElementById('btn.refresh');

      // Sets the on click event for the refresh button
      button.addEventListener('click', (event) => {
        // Send the refresh command to server
        ganacheDetails.config.vscode.postMessage({command: 'refresh'});

        // Prevent the propagation of on click event
        event.stopPropagation();
        event.preventDefault();
      });
    },
  },
  provider: {
    set: (data) => {
      // Sets the web3 provider information got from server
      ganacheDetails.content.set(data);
    },
  },
  content: {
    set: (data) => {
      // Sets the top menu information
      document.getElementById('current.block').innerText = data.currentBlock;
      document.getElementById('gas.price').innerText = data.gasPrice;
      document.getElementById('gas.limit').innerText = data.gasLimit;
      document.getElementById('network.id').innerText = data.networkId;
      document.getElementById('rpc.server').innerText = data.rpcServer;

      // Sets the transaction information
      const txs = Object.values(data.txs);

      if (txs.length === 0)
        // If there is no transactions, it shows the friendly message
        ganacheDetails.content.txs.empty();
      // If there is transactions, it shows the transaction list
      else ganacheDetails.content.txs.set(txs);
    },
    txs: {
      set: (txs) => {
        // Gets the transactions container
        const container = document.getElementById('txs.container');
        container.innerHTML = '';

        // Reads all transactions and creates the HTML object
        txs.forEach((tx) => {
          const node = document.createElement('div');
          node.className = 'MiniTxCard';
          node.innerHTML = ganacheDetails.content.txs.row.set(tx);

          container.appendChild(node);
        });
      },
      empty: () => {
        // Gets the transactions container
        const container = document.getElementById('txs.container');
        container.innerHTML = '';

        // Sets a friendly message
        const node = document.createElement('div');
        node.className = 'Waiting';
        node.innerText = 'No transactions';

        // Shows the message
        container.appendChild(node);
      },
      row: {
        set: (tx) => {
          // Sets the transaction html row
          var html = `
            <div class="Row Top">
              <div class="RowItem">
                <div class="TxHash">
                  <div class="Label">TX HASH</div>
                  <div class="Value">${tx.hash}</div>
                </div>
              </div>
            </div>
            <div class="SecondaryItems">
              <div class="Row">
                <div class="RowItem">
                  <div class="From">
                    <div class="Label">FROM ADDRESS</div>
                    <div class="Value">${tx.fromAddress}</div>
                  </div>
                </div>
                <div class="RowItem">
                  <div class="DestinationAddress">
                    <div class="Label">CREATED CONTRACT ADDRESS</div>
                    <div class="Value">
                      <div class="ContractCreationAddress">
                        <span>${tx.createdContractAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="RowItem">
                  <div class="GasUsed">
                    <div class="Label">GAS USED</div>
                    <div class="Value">${tx.gasUsed}</div>
                  </div>
                </div>
                <div class="RowItem">
                  <div class="Value">
                    <div class="Label">VALUE</div>
                    <div class="Value">${tx.value}</div>
                  </div>
                </div>
              </div>
            </div>`;

          // Return the html
          return html;
        },
      },
    },
  },
};

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
  const data = event.data; // The json data that the extension sent
  switch (data.command) {
    case 'provider.set': {
      // Sets the web3 provider information got from server
      ganacheDetails.provider.set(data.data);
      break;
    }
  }
});

// Handle the page load event
window.addEventListener('load', () => {
  // Sets the on click event for the refresh button
  ganacheDetails.actions.set();
});
