// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class NotSupportedProperty extends React.Component {
  render() {
    const { property } = this.props;

    return <TextField
      className='metadata text field'
      disabled
      fullWidth
      label={property.name}
      value={'Sorry! Complex structures has not supported yet!'}
    />;
  }
}

export default NotSupportedProperty;

NotSupportedProperty.propTypes = {
  property: PropTypes.object.isRequired,
};
