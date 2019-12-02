// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Container } from '@material-ui/core';
import { deepEqual } from 'helpers';
import { DrizzleContext } from '@drizzle/react-plugin';
import PropTypes from 'prop-types';
import React from 'react';
import {
  BaseViewComponent,
  EventSection,
  ExecutionSection,
  StateSection
} from 'components';
import './interaction.less';

const getExecutableMethods = (contract) => {
  const isExecutableAbiMethod = (abiEl) => (abiEl.type === 'function' && abiEl.constant === false);
  const executableAbiMethods = contract.abi.filter(isExecutableAbiMethod).map(el => el.name);

  return Object.keys(contract.methods).filter(m => executableAbiMethods.indexOf(m) !== -1);
};

class Interaction extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      methods: undefined,
      contractName: undefined,
      subscription: undefined,
      events: []
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

    const { contractName } = contract;
    const methods = Object.keys(contract);

    const state = {
      ...this.state,
      methods,
      contractName
    };

    if (!deepEqual(this.state, state)) {
      if (!!this.state.subscription) {
        this.state.subscription.unsubscribe();
      }

      const subscription = contract.events.allEvents()
        .on('data', (event) => this.setState({ events: [...this.state.events, event] }));

      this.setState({ ...state, subscription });
    }
  }

  render() {
    const { events } = this.state;

    return <BaseViewComponent
      header='Interaction'
      className='interaction component'
    >
      <Container className='container'>
        <Container className='input'>
          <ExecutionSection
            actions={getExecutableMethods(this.props.drizzle.contractList[0])}
            contractName={this.props.drizzle.contractList[0].contractName}
            drizzle={this.props.drizzle}
            render={this.renderExecutionSection}
          />
        </Container>
        <Container className='output'>
          <StateSection
            contract={this.props.drizzle.contractList[0]}
          />
          <EventSection
            events={events}
          />
        </Container>
      </Container>
    </BaseViewComponent>;
  }
}

const HOC = () => <DrizzleContext.Consumer>
  {props => <Interaction {...props} />}
</DrizzleContext.Consumer>;

export default HOC;

Interaction.propTypes = {
  drizzle: PropTypes.shape({
    contractList: PropTypes.arrayOf(PropTypes.shape({
      contractName: PropTypes.string.isRequired,
      methods: PropTypes.object.isRequired,
      events: PropTypes.shape({
        allEvents: PropTypes.func.isRequired
      }).isRequired,
      options: PropTypes.shape({
        isOnline: PropTypes.bool.isRequired
      }).isRequired
    })).isRequired
  }).isRequired,
  drizzleState: PropTypes.any
};
