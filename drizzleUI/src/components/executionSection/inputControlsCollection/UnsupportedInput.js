import PropTypes from 'prop-types';
import React from 'react';
import { Container, FormHelperText, FormLabel } from '@material-ui/core';

class UnsupportedInput extends React.Component {
  render() {
    return <Container className='unsupported-input'>
      <FormHelperText>{this.props.item.name}</FormHelperText>
      <FormLabel >Unsupported input type</FormLabel>
    </Container>;
  }
}

export default UnsupportedInput;

UnsupportedInput.propTypes = {
  item: PropTypes.any.isRequired,
};
