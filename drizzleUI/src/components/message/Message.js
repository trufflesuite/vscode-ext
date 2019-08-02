// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Chip } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

class Message extends React.PureComponent {
  render() {
    const {
      className = '',
      message
    } = this.props;

    return <Chip
      className={className}
      color='secondary'
      variant='outlined'
      label={message}
    />;
  }
}

export default Message;

Message.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string.isRequired
};
