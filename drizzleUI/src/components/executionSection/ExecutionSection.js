// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createInputComponent } from '../factory/InputComponentFactory';
import { newContextComponents } from 'drizzle-react-components';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Button,
  Container,
  InputLabel,
  MenuItem,
  Select
} from '@material-ui/core';
import './executionSection.less';

const { ContractForm } = newContextComponents;

class ExecutionSection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      executedMethod: '',
      disabledExecute: false,
      transactionPending: false,
      formControlsValidation: {},
      unsubscribe: undefined,
    };
  }

  componentDidMount() {
    const { actions, drizzle } = this.props;

    const unsubscribe = drizzle.store.subscribe(this.updateTransactionStatus);
    const formControlsValidation = this.createFormControlsList(actions[0]);

    this.setState({
      executedMethod: actions[0],
      formControlsValidation,
      unsubscribe,
    });
  }

  componentDidUpdate = () => {
    const isUnsupportedInputExist = !!document.getElementsByClassName('unsupported-input').length;
    const validationValues = Object.values(this.state.formControlsValidation);
    const errors = validationValues.filter(value => value !== '' && value !== undefined);
    const isDisabled = isUnsupportedInputExist || errors.length > 0;
    if (isDisabled !== this.state.disabledExecute) {
      this.setState({ disabledExecute: isDisabled });
    }
  };

  componentWillUnmount() {
    this.state.unsubscribe();
  }

  updateTransactionStatus = () => {
    const { store } = this.props.drizzle;

    const { transactionStack, transactions } = store.getState();

    const lastTransaction = transactionStack[transactionStack.length - 1];

    if (!!lastTransaction && !!transactions[lastTransaction]) {
      const transactionPending = transactions[lastTransaction].status !== 'success';

      if (this.state.transactionPending !== transactionPending) {
        this.setState({
          transactionPending,
        });
      }
    }
  }

  createFormControlsList = (executedMethod) => {
    const method = this.props.drizzle.contracts[this.props.contractName].abi.find(
      element => !element.constant && element.name === executedMethod);
    const formControlsValidation = {};
    method.inputs.forEach(input => {
      formControlsValidation[input.name] = '';
    });
    return formControlsValidation;
  };

  onChange = (e) => {
    const formControlsValidation = this.createFormControlsList(e.target.value);
    this.setState({
      executedMethod: e.target.value,
      formControlsValidation,
    });
  };

  updateValidationResult = (name, errorMessage) => {
    this.setState({ formControlsValidation: { ...this.state.formControlsValidation, [name]: errorMessage } });
  }

  renderExecutionSection = ({ inputs, handleInputChange, handleSubmit }) => {
    return <Container className='execution-section'>
      <Container className='action'>
        <InputLabel className='input-label'>Contract Action</InputLabel>
        <Select
          className='execution-method'
          value={this.state.executedMethod}
          onChange={this.onChange}
          inputProps={{
            id: 'action-method',
            name: 'action'
          }}
        >
          {this.props.actions.map((action, index) => {
            return (
              <MenuItem key={index} value={action}>{action}</MenuItem>
            );
          })}
        </Select>
      </Container>
      <Container className='input-fields'>
        {inputs.map((item, index) => {
          return createInputComponent(
            item,
            handleInputChange,
            this.updateValidationResult.bind(this, item.name),
            index,
            {
              executedMethod: this.state.executedMethod,
              enumsInfo: this.props.drizzle.contracts[this.props.contractName].options.enumsInfo,
            });
        })}
      </Container>
      <Button
        className='execute-button'
        variant='contained'
        onClick={handleSubmit}
        disabled={this.state.disabledExecute || this.state.transactionPending}
      >
        Execute
      </Button>
    </Container>;
  };

  render() {
    return <ContractForm
      key={this.state.executedMethod}
      contract={this.props.contractName}
      method={this.state.executedMethod}
      drizzle={this.props.drizzle}
      render={this.renderExecutionSection}
    />;
  }
}

export default ExecutionSection;

ExecutionSection.propTypes = {
  actions: PropTypes.any.isRequired,
  contractName: PropTypes.string.isRequired,
  drizzle: PropTypes.any.isRequired,
};
