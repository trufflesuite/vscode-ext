// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

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
import { InputComponentMapping, UnsupportedInput } from './inputControlsCollection';
import './executionSection.less';

const { ContractForm } = newContextComponents;

class ExecutionSection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      executedMethod: undefined
    };
  }

  componentDidMount() {
    this.setState({ executedMethod: this.props.actions[0] });
  }

  onChange = (e) => this.setState({
    executedMethod: e.target.value
  });

  renderExecutionSection = ({ inputs, handleInputChange, handleSubmit }) => {
    const containsUnsupportedInput = inputs.some(input => !InputComponentMapping[input.type]);

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
          const InputControl = InputComponentMapping[item.type] || UnsupportedInput;
          return <InputControl
            key={index}
            item={item}
            handleInputChange={handleInputChange}
          />;
        })}
      </Container>
      <Button
        className='execute-button'
        variant='contained'
        onClick={handleSubmit}
        disabled={containsUnsupportedInput}
      >
        Execute
      </Button>
    </Container>;
  }

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
