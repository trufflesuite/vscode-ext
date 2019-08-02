// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { BaseViewComponent } from 'components';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Container,
  InputLabel,
  MenuItem,
  Select
} from '@material-ui/core';
import './contractSelector.less';

class ContractSelector extends React.Component {
  renderOption = (contractInstance, index) => {
    const {
      id,
      updateDate
    } = contractInstance;

    const itemName = (new Date(updateDate)).toGMTString();

    return <MenuItem
      key={index}
      value={id}
    >
      {itemName}
    </MenuItem>;
  }

  render() {
    const {
      selectedContractId = '',
      contractInstances = [],
      onChange
    } = this.props;

    return <BaseViewComponent
      className='selector component'
      header='Select a contract version'
    >
      <Container className='container'>
        <InputLabel htmlFor='contract-selector'>
          Contract deployment date
        </InputLabel>
        <Select
          id='contract-selector'
          value={selectedContractId}
          onChange={onChange}
        >
          {contractInstances.map(this.renderOption)}
        </Select>
      </Container>
    </BaseViewComponent>;
  }
}

export default ContractSelector;

ContractSelector.propTypes = {
  selectedContractId: PropTypes.string,
  contractInstances: PropTypes.array,
  onChange: PropTypes.func.isRequired
};
