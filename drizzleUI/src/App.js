// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Container } from '@material-ui/core';
import { DrizzleContext } from 'drizzle-react';
import { IPC } from 'services';
import PropTypes from 'prop-types';
import React from 'react';
import { SingleContractView } from 'views';
import { Url } from 'helpers/url';
import {
  ContractSelector,
  Message
} from 'components';
import {
  createMuiTheme,
  MuiThemeProvider
} from '@material-ui/core/styles';
import './app.less';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      updating: false,
      contractInstances: [],
      selectedContractId: undefined,
      theme: createMuiTheme({
        palette: {
          type: 'light'
        }
      })
    };

    this.target = document.querySelector('body');
    this.observer = new MutationObserver(this.updateTheme);

    this.observer.observe(this.target, { attributes: true, childList: false });
  }

  componentDidMount() {
    IPC.on('contracts', this.updateContracts);
    IPC.postMessage('documentReady', true);
  }

  componentDidUpdate() {
    const {
      updating,
      contractInstances,
      selectedContractId
    } = this.state;

    if (
      !updating
      && !selectedContractId
      && contractInstances.length !== 0
    ) {
      const contractInstance = contractInstances[0];
      this.setContract(contractInstance);
    }
  }

  updateContracts = contractInstances => this.setState({
    contractInstances: contractInstances.reverse()
  });

  onContractChange = (e) => {
    const { value } = e.target;
    const { contractInstances } = this.state;

    this.setContract(contractInstances.find(instance => instance.id === value));
  }

  setContract = async contractInstance => {
    // Workaround. Used to prevent drizzle fallback actions.
    window.showErrors = false;
    this.setState({ updating: true });

    const { drizzle } = this.props;
    const { contract, provider } = contractInstance;

    drizzle.deleteAllContracts();

    if (provider) {
      const host = new URL(Url.normalize(provider.host));

      host.protocol = 'ws';

      drizzle.web3.setProvider(host.toString());
    }

    const address = contractInstance.address;
    const networkName = contractInstance.network.name;
    const accounts = await drizzle.web3.eth.getAccounts();

    const contractConfig = {
      contractName: contract.contractName,
      web3Contract: new drizzle.web3.eth.Contract(
        contract.abi,
        address,
        {
          from: accounts[0],
          data: contract.bytecode,
          networks: contract.networks,
          isOnline: !!provider,
          networkName,
          enumsInfo: contractInstance.enumsInfo,
        }
      ),
    };

    drizzle.addContract(contractConfig);

    // Workaround. Used to prevent drizzle fallback actions.
    setTimeout(() => { window.showErrors = true; }, 2000);

    this.setState({
      selectedContractId: contractInstance.id,
      updating: false
    });
  }

  updateTheme = () => {
    const type = Array
      .from(this.target.classList)
      .includes('vscode-dark') ? 'dark' : 'light';

    if (this.state.theme.palette.type !== type) {
      this.setState({
        theme: createMuiTheme({ palette: { type } })
      });
    }
  }

  render() {
    const { contractInstances, selectedContractId, theme } = this.state;
    const { drizzle: { contractList }, initialized } = this.props;

    if (!initialized) {
      return <Container className='message container'>
        <Message message='⚙️ Loading dapp...' />
      </Container>;
    }

    if (!contractList || contractList.length === 0) {
      return <Container className='message container'>
        <Message message='⚠️ No contracts available' />
      </Container>;
    }

    return <MuiThemeProvider theme={theme}>
      <Container>
        <ContractSelector
          selectedContractId={selectedContractId}
          contractInstances={contractInstances}
          onChange={this.onContractChange}
        />
        <SingleContractView />
      </Container>
    </MuiThemeProvider>;
  }
}

const HOC = () => <DrizzleContext.Consumer>
  {props => <App {...props} />}
</DrizzleContext.Consumer>;

export default HOC;

App.propTypes = {
  drizzle: PropTypes.any,
  drizzleState: PropTypes.any,
  initialized: PropTypes.bool.isRequired,
};
