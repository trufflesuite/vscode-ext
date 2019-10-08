// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import ComplexField from './ComplexField';
import { deepEqual } from '../../../helpers';
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

class ArrayProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      property: {
        name: '',
        value: [],
        outputs: [],
      },
    };
  }

  componentDidMount() {
    this.getArrayPropertyInfo();
  }

  componentDidUpdate() {
    this.getArrayPropertyInfo();
  }

  getArrayValues = async () => {
    const valueArray = [];

    try {
      let counter = 0;
      const maxDisplayedItems = 8000;

      while (true) { // eslint-disable-line
        if (counter > maxDisplayedItems) {
          valueArray.push(`... more than ${maxDisplayedItems} items`);
          break;
        }
        const elementValue = await this.props.property.method(counter).call();
        valueArray.push(elementValue);
        counter++;
      }
      return valueArray;
    } catch {
      return valueArray;
    }
  };

  getArrayPropertyInfo = () => {
    this.getArrayValues().then(result => {
      if (!deepEqual(this.state.property.value, result)) {
        this.setState({
          property: {
            name: this.props.property.name,
            value: result,
            outputs: this.props.property.outputs,
          }
        });
      }
    });
  };

  renderArrayElements = () => {
    return this.state.property.value.map((value, index) => {
      if (value instanceof Object) {
        return <ComplexField
          key={index}
          fields={this.state.property.outputs}
          values={value}
          name={`[${index}] : `}
        />;
      }
      return (
        <TextField
          className='metadata text field'
          disabled
          fullWidth
          key={index}
          label={`[${index}] : `}
          value={value}
        />
      );
    });
  };

  render() {
    return <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>
          {`${this.state.property.name} [ ] :`}
        </Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Container>{this.renderArrayElements()}</Container>
      </ExpansionPanelDetails>
    </ExpansionPanel>;
  }
}

export default ArrayProperty;

ArrayProperty.propTypes = {
  property: PropTypes.object.isRequired,
};
