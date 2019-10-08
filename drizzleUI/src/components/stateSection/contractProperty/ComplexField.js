// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Container,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  TextField,
  Typography,
} from '@material-ui/core';
import '../stateSection.less';

class ComplexField extends React.Component {
  renderFields = () => {
    return this.props.fields.map((field, index) => {
      return (
        <TextField
          className='metadata text field'
          disabled
          fullWidth
          key={index}
          label={`${field.name}: `}
          value={this.props.values[field.name]}
        />
      );
    });
  };

  render() {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} href={''}>
          <Typography>
            {this.props.name}
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Container>{this.renderFields()}</Container>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default ComplexField;

ComplexField.propTypes = {
  name: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
  fields: PropTypes.array.isRequired,
};
