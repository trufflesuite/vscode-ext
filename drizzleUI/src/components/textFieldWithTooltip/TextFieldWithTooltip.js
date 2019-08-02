// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import PropTypes from 'prop-types';
import React from 'react';
import {
  TextField,
  Tooltip
} from '@material-ui/core';

class TextFieldWithTooltip extends React.PureComponent {
  render() {
    const {
      id,
      open,
      title,
      leaveDelay,
      onClose,
      onClick,
      disabled = false,
      className = '',
      fullWidth = false,
      label,
      value,
      placement = 'top'
    } = this.props;

    return <Tooltip
      open={open}
      title={title}
      leaveDelay={leaveDelay}
      placement={placement}
      onClose={onClose}
    >
      <TextField
        id={id}
        disabled={disabled}
        className={className}
        fullWidth={fullWidth}
        onClick={onClick}
        label={label}
        value={value}
      />
    </Tooltip>;
  }
}

export default TextFieldWithTooltip;

TextFieldWithTooltip.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  leaveDelay: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  id: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.any,
  placement: PropTypes.string
};
