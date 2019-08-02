// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Container } from '@material-ui/core';
import { DrizzleContext } from 'drizzle-react';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Interaction,
  Message,
  Metadata,
} from 'components';
import './singleContractView.less';

class SingleContractView extends React.PureComponent {
  render() {
    const { drizzle } = this.props;
    const contract = drizzle.contractList[0];
    const { isOnline } = contract.options;

    if (!contract) {
      return <Message message='No contract'/>;
    }

    if (!isOnline) {
      return <Message className='red-error' message='Connection error' />;
    }

    return <Container className='single contract view'>
      <Interaction/>
      <Metadata />
    </Container>;
  }
}

const HOC = () => <DrizzleContext.Consumer>
  { props => <SingleContractView {...props} /> }
</DrizzleContext.Consumer>;

export default HOC;

SingleContractView.propTypes = {
  drizzle: PropTypes.any,
  drizzleState: PropTypes.any
};
