// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from 'constants';
import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';
const { placeholder, validationMessages, validationRegexps } = Constants.executionSection;

class AddressInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      errorMessage: '',
    };
  }

  onChange = (event) => {
    const { value } = event.target;
    const errorMessage = this.getErrorMessage(value);
    this.setState({ value, errorMessage });
    this.props.updateValidationResult(errorMessage);
    this.props.handleInputChange(event);
  };

  getErrorMessage = (value) => {
    if (value && !value.match(validationRegexps.address)) {
      return validationMessages.address(this.props.item.name);
    }

    return '';
  };

  render() {
    const { name } = this.props.item;

    return <TextField
      error={!!this.state.errorMessage}
      helperText={this.state.errorMessage}
      className='address-input'
      label={`${name}:`}
      name={name}
      onChange={this.onChange}
      value={this.state.value}
      placeholder={placeholder.address}
    />;
  }
}

export default AddressInput;

AddressInput.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
  }),
  handleInputChange: PropTypes.func.isRequired,
  updateValidationResult: PropTypes.func.isRequired,
};
