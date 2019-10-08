// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import ComplexField from './ComplexField';
import { deepEqual } from '../../../helpers';
import PropTypes from 'prop-types';
import React from 'react';
import '../stateSection.less';

class StructProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      property: {
        name: '',
        value: {},
        outputs: [],
      },
    };
  }

  componentDidMount() {
    this.getStructPropertyInfo();
  }

  componentDidUpdate() {
    this.getStructPropertyInfo();
  }

  getStructPropertyInfo = () => {
    this.props.property.method().call().then(result => {
      if (!deepEqual(this.state.property.value, result)) {
        this.setState({
          property: {
            name: this.props.property.name,
            value: result,
            outputs: this.props.property.outputs
          }
        });
      }
    });
  };

  render() {
    return <ComplexField
      fields={this.state.property.outputs}
      values={this.state.property.value}
      name={`${this.state.property.name}:`}
    />;
  }
}

export default StructProperty;

StructProperty.propTypes = {
  property: PropTypes.object.isRequired,
};
