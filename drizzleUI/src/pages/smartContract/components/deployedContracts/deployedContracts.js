import Card from 'components/card/card';
import React from 'react';
import Title from 'components/title/title';
import './deployedContracts.less';

class DeployedContracts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deployedContracts: []
    };
  }

  render() {
    const { deployedContracts } = this.state;

    return (
      <Card className='ui deployed contracts'>
        <Title
          text='Deployed Contracts'
        />
        <div className='contracts list'>
          {
            !deployedContracts.length
            && <div className='empty'>Currently you have no contract instances to interact with.</div>
          }
        </div>
      </Card>
    );
  }
}

export default DeployedContracts;
