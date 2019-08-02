// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import {
  Paper,
  Typography
} from '@material-ui/core';

class BaseViewComponent extends React.PureComponent {
  render() {
    const {
      header,
      children,
      className
    } = this.props;

    return <Paper className={`paper ${className || ''}`}>
      <Typography
        variant='h5'
        component='h3'
        align='left'
      >
        {header}
      </Typography>
      {children}
    </Paper>;
  }
}

export default BaseViewComponent;

BaseViewComponent.propTypes = {
  header: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.any
};
