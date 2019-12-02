// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DrizzleContext } from '@drizzle/react-plugin';
import { FileCopy } from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';
import {
  BaseViewComponent,
  LabelWithIcon,
  Message,
  TextFieldWithTooltip
} from 'components';
import {
  Container,
  TextField
} from '@material-ui/core';
import { copy, deepEqual } from 'helpers';
import './metadata.less';

class Metadata extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      abi: undefined,
      address: undefined,
      bytecode: undefined,
      events: undefined,
      network: undefined,
      networkName: undefined,
      showBytecodeTooltip: false,
      showABITooltip: false,
      transaction: {
        from: '',
      },
    };
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const contract = this.props.drizzle.contractList[0];

    if (!contract) {
      return;
    }

    const abi = JSON.stringify(contract.abi);
    const address = contract.address;
    const bytecode = contract.options.data;
    const events = this.getEvents();
    const network = this.getNetwork();
    const networkName = contract.options.networkName;

    const state = {
      ...this.state,
      abi,
      address,
      bytecode,
      events,
      network,
      networkName
    };

    if (!deepEqual(this.state, state)) {
      this.getTransactionInfo(state.network.transactionHash)
        .then((transaction) => this.setState({ ...state, transaction }))
        .catch(() => this.setState(state));
    }
  }

  copyBytecodeToClipboard = () => {
    copy(this.state.bytecode);
    this.showBytecodeTooltip();
  };

  copyABIToClipboard = () => {
    copy(this.state.abi);
    this.showABITooltip();
  }

  getEvents = () => {
    const { drizzle } = this.props;
    const { events } = drizzle.contractList[0];

    return Object.keys(events)
      .find(key => key.match(/0x(\d|\S)+/g)) || '';
  }

  getNetwork = () => {
    const { drizzle } = this.props;
    const contract = drizzle.contractList[0];
    const { networks } = contract.options;

    const networkKey = Object.keys(networks)
      .find((key) => networks[key].address === contract.address);

    return Object.assign(networks[networkKey], { id: networkKey });
  }

  getTransactionInfo = (transactionHash) => {
    const { drizzle } = this.props;
    const { getTransaction } = drizzle.contractList[0].web3.eth;

    return getTransaction(transactionHash);
  }

  showBytecodeTooltip = () => this.setState({ showBytecodeTooltip: true });

  showABITooltip = () => this.setState({ showABITooltip: true });

  hideBytecodeTooltip = () => this.setState({ showBytecodeTooltip: false });

  hideABITooltip = () => this.setState({ showABITooltip: false });

  render() {
    const {
      abi,
      address,
      events,
      network,
      bytecode,
      transaction,
      networkName,
      showABITooltip,
      showBytecodeTooltip
    } = this.state;

    if (!abi || !bytecode) {
      return <BaseViewComponent header='Metadata' className='metadata component'>
        <Message message='Contract not loaded (ABI or bytecode not defined)' />
      </BaseViewComponent>;
    }

    const byteCodeLabel = <LabelWithIcon text='Bytecode:' icon={<FileCopy />} />;
    const ABILabel = <LabelWithIcon text='ABI:' icon={<FileCopy />} />;

    return <BaseViewComponent
      header='Metadata'
      className='metadata component'
    >
      <Container className='list'>
        <TextField
          disabled
          fullWidth
          id='deployed-location'
          label='Deployed Location:'
          value={networkName || network.id}
          className='text field'
        />
        <TextField
          disabled
          fullWidth
          id='contract-address'
          label='Contract Address:'
          value={address}
          className='text field'
        />
        <TextField
          disabled
          fullWidth
          id='creator-account'
          label='Creator Account:'
          value={transaction && transaction.from || ''}
          className='text field'
        />
        <TextFieldWithTooltip
          open={showBytecodeTooltip}
          title='Bytecode copied to clipboard!'
          leaveDelay={900}
          onClose={this.hideBytecodeTooltip}
          disabled
          fullWidth
          id='bytecode'
          label={byteCodeLabel}
          onClick={this.copyBytecodeToClipboard}
          value={bytecode}
          className='text field'
        />
        <TextFieldWithTooltip
          open={showABITooltip}
          title='ABI copied to clipboard!'
          leaveDelay={900}
          onClose={this.hideABITooltip}
          disabled
          fullWidth
          id='abi'
          label={ABILabel}
          onClick={this.copyABIToClipboard}
          value={abi}
          className='text field'
        />
        <TextField
          disabled
          fullWidth
          id='tx-history'
          label='TX History:'
          value={network.transactionHash}
          className='text field'
        />
        <TextField
          disabled
          fullWidth
          id='events'
          label='Events:'
          value={events}
          className='text field'
        />
      </Container>
    </BaseViewComponent>;
  }
}

const HOC = () => <DrizzleContext.Consumer>
  {props => <Metadata {...props} />}
</DrizzleContext.Consumer>;

export default HOC;

Metadata.propTypes = {
  drizzle: PropTypes.shape({
    contractList: PropTypes.arrayOf(PropTypes.shape({
      abi: PropTypes.array.isRequired,
      address: PropTypes.string.isRequired,
      events: PropTypes.object.isRequired,
      options: PropTypes.shape({
        data: PropTypes.string.isRequired,
        networks: PropTypes.object.isRequired,
        networkName: PropTypes.string,
      }).isRequired,
      web3: PropTypes.shape({
        eth: PropTypes.shape({
          getTransaction: PropTypes.func.isRequired,
        }).isRequired,
      }).isRequired,
    })).isRequired
  }).isRequired
};
