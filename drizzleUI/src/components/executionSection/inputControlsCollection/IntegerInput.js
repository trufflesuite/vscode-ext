// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class IntegerInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: 0n,
      min: BigInt(this.props.min),
      max: BigInt(this.props.max),
      isBigInt: true,
      error: undefined,
    };
  }

  componentDidUpdate() {
    const min = BigInt(this.props.min);
    const max = BigInt(this.props.max);

    if (
      this.state.min !== min ||
      this.state.max !== max
    ) {
      this.setState({ min, max });
    }
  }

  onChange = (e) => {
    const { value } = e.target;

    let isBigInt = true;

    try {
      BigInt(value);
    } catch (error) {
      isBigInt = false;
    }

    const error = this.getErrorMessage(value, isBigInt);
    this.setState({ value, isBigInt, error });
    this.props.handleInputChange(e);
    this.props.updateValidationResult(error);
  };

  getErrorMessage = (value, isBigInt) => {
    const { min, max, pow, item } = this.props;

    if (value > max) {
      return `${item.name} can only safely store up to ${pow} bits`;
    }

    if (value < min) {
      if (min === 0n) {
        return `${item.name} should be a positive`;
      }

      return `${item.name} can only safely store up to ${pow} bits`;
    }

    if (!isBigInt) {
      return `${item.name} required as number`;
    }

    return '';
  };

  render() {
    const { value, error } = this.state;
    const { item: { name } } = this.props;

    return <TextField
      error={!!error}
      helperText={error}
      className='input-field'
      id={name}
      label={`${name}:`}
      name={name}
      onChange={this.onChange}
      value={value}
    />;
  }
}

export default IntegerInput;

IntegerInput.propTypes = {
  item: PropTypes.any.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  min: PropTypes.any.isRequired,
  max: PropTypes.any.isRequired,
  pow: PropTypes.number.isRequired,
  updateValidationResult: PropTypes.func.isRequired,
};
