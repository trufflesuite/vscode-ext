// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Box } from '@material-ui/core';
import { GetStateComponent } from '../factory/StateComponentFactory';
import PropTypes from 'prop-types';
import React from 'react';

class StateSection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stateObjects: this.getStateObjects(),
    };
  }

  getStateObjects() {
    const abi = this.props.contract.abi;
    const methods = this.props.contract.methods;

    return abi
      .filter(element => element.constant)
      .map((constant) => Object.assign(
        constant,
        {
          method: methods[constant.name],
          value: '',
          enumsInfo: this.props.contract.options.enumsInfo,
        }));
  }

  renderStateObjects() {
    return this.state.stateObjects.map((stateObject, index) => {
      return GetStateComponent(stateObject, index);
    });
  }

  render() {
    return <Box
      className='state-section'>
      {this.renderStateObjects()}
    </Box>;
  }
}

export default StateSection;

StateSection.propTypes = {
  contract: PropTypes.shape({
    abi: PropTypes.array.isRequired,
    methods: PropTypes.object.isRequired,
    options: PropTypes.shape({
      enumsInfo: PropTypes.object.isRequired
    }).isRequired
  }).isRequired
};
