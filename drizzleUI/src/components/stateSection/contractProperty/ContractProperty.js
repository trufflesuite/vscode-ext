// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class ContractProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      property: {
        name: '',
        value: '',
      },
    };
  }

  componentDidMount() {
    this.getPropertyInfo();
  }

  componentDidUpdate() {
    this.getPropertyInfo();
  }

  getPropertyInfo = () => {
    this.props.property.method().call().then(result => {
      const property = Object.assign({ name: this.props.property.name, value: result });
      if (property.name !== this.state.property.name
        || property.value !== this.state.property.value) {
        this.setState({ property });
      }
    });
  }

  render() {
    const { property } = this.state;

    return <TextField
      className='metadata text field'
      disabled
      fullWidth
      id='contract-address'
      label={property.name}
      value={property.value}
    />;
  }
}

export default ContractProperty;

ContractProperty.propTypes = {
  property: PropTypes.object.isRequired,
};
