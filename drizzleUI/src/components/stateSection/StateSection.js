// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import ContractProperty from './contractProperty/ContractProperty';
import PropTypes from 'prop-types';
import React from 'react';

class StateSection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stateObjects: this.getStateObjects(),
    };
  }

  getStateObjects = () => {
    const abi = this.props.contract.abi;
    const methods = this.props.contract.methods;

    const constants = abi.filter(element => element.constant);

    const stateObjects = [];
    for (let i = 0; i < constants.length; i++) {
      const stateMethod = methods[constants[i].name];
      const stateObject = Object.assign(
        constants[i],
        { method: stateMethod },
        { value: '' });
      stateObjects.push(stateObject);
    }

    return stateObjects;
  }

  renderStateObjects() {
    return this.state.stateObjects.map((stateObject, index) => {
      return (
        <ContractProperty
          key={index}
          property={stateObject}
        />
      );
    });
  }

  render() {
    return <>
      {this.renderStateObjects()}
    </>;
  }
}

export default StateSection;

StateSection.propTypes = {
  contract: PropTypes.shape({
    abi: PropTypes.array.isRequired,
    methods: PropTypes.object.isRequired,
  }).isRequired
};
