// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import {
  Container,
  InputLabel,
  MenuItem,
  Select
} from '@material-ui/core';

class BooleanInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = { value: false };
  }

  onChange = (event) => {
    this.setState({ value: event.target.value });
    this.props.handleInputChange(event);
  }

  render() {
    return <Container className='boolean-input'>
      <InputLabel shrink>
        {this.props.item.name}
      </InputLabel>
      <Select
        id={this.props.item.name}
        name={this.props.item.name}
        onChange={this.onChange}
        value={this.state.value}
        displayEmpty
      >
        <MenuItem key='false' value={false}>False</MenuItem>
        <MenuItem key='true' value={true}>True</MenuItem>
      </Select>
    </Container>;
  }
}

export default BooleanInput;

BooleanInput.propTypes = {
  item: PropTypes.any.isRequired,
  handleInputChange: PropTypes.func.isRequired,
};
