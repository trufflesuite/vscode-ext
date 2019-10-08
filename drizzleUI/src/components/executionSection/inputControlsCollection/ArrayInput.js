// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class ArrayInput extends React.Component {
  constructor(props) {
    super(props);

    const value = '';
    const errorMessage = this.getErrorMessage(value);
    this.props.updateValidationResult(errorMessage);

    this.state = {
      value,
      errorMessage,
    };
  }

  onChange = (event) => {
    const errorMessage = this.getErrorMessage(event.target.value);
    this.props.updateValidationResult(errorMessage);
    this.setState({ value: event.target.value, errorMessage });
    this.props.handleInputChange({
      target: {
        name: this.props.item.name,
        type: this.props.item.type,
        value: !errorMessage
          ? JSON.parse(event.target.value)
          : undefined,
      }
    });
  };

  getErrorMessage = (value) => {
    try {
      JSON.parse(value);
      return '';
    } catch {
      return 'Should be a valid JSON';
    }
  };

  render() {
    return <TextField
      multiline
      fullWidth
      rowsMax={10}
      error={!!this.state.errorMessage}
      helperText={this.state.errorMessage}
      placeholder={this.props.item.type}
      id={this.props.item.name}
      label={`${this.props.item.name} :`}
      name={this.props.item.name}
      onChange={this.onChange}
      value={this.state.value}
    />;
  }
}

export default ArrayInput;

ArrayInput.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  updateValidationResult: PropTypes.func.isRequired,
};
