// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class SimpleProperty extends React.Component {
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
      let newValue = result;

      const relatedEnum = this.props.property.enumsInfo.fields[this.state.property.name];
      if (relatedEnum !== undefined) {// replace uint value to enum named instance
        const enumValue = relatedEnum.find(i => i.value === +result);
        if (enumValue) {
          newValue = enumValue.name;
        }
      }

      if (newValue !== this.state.property.value || this.props.property.name !== this.state.property.name) {
        this.setState({
          property: {
            name: this.props.property.name,
            value: newValue
          }
        });
      }
    });
  };

  render() {
    const { property } = this.state;
    return <TextField
      className='metadata text field'
      disabled
      fullWidth
      label={property.name}
      value={property.value}
    />;
  }
}

export default SimpleProperty;

SimpleProperty.propTypes = {
  property: PropTypes.object.isRequired,
};
