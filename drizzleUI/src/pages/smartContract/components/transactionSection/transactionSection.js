import Card from 'components/card/card';
import React from 'react';
import Title from 'components/title/title';
import './transactionSection.less';

class TransactionSection extends React.Component {
  render() {
    return (
      <Card className='ui transaction section'>
        <Title
          text='Deployed Contracts'
        />
        <div className='text'>
          All transactions (deployed contracts and function executions) in this
          environment can be saved and replayed in another environment. e.g
          Transactions created in Javascript VM can be replayed in the Injected Web3.
        </div>
      </Card>
    );
  }
}

export default TransactionSection;
