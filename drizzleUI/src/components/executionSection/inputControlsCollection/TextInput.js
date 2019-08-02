// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class TextInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = { value: '' };
    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    this.setState({ value: event.target.value });
    this.props.handleInputChange(event);
  }

  render() {
    return <TextField
      className='input-field'
      id={this.props.item.name}
      label={`${this.props.item.name} :`}
      name={this.props.item.name}
      onChange={this.onChange}
      value={this.state.value}
    />;
  }
}

export default TextInput;

TextInput.propTypes = {
  item: PropTypes.any.isRequired,
  handleInputChange: PropTypes.any.isRequired,
};
