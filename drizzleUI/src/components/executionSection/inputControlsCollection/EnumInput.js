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

class EnumInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = { value: undefined };
    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    this.setState({ value: event.target.value });
    this.props.handleInputChange({
      target: {
        name: this.props.title,
        value: event.target.value
      }
    });
  }

  render() {
    return <Container className='enum-select'>
      <InputLabel shrink>
        {this.props.title}
      </InputLabel>
      <Select
        id={this.props.title}
        name={this.props.title}
        onChange={this.onChange}
        value={this.state.value}
        inputProps={{
          id: 'action-method',
          name: 'action'
        }}
      >
        {this.props.items.map(item => {
          return (
            <MenuItem key={item.value} value={item.value}>{item.name}</MenuItem>
          );
        })}
      </Select>
    </Container>;
  }
}

export default EnumInput;

EnumInput.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  handleInputChange: PropTypes.func.isRequired,
};
