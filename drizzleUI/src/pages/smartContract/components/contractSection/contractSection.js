import Button from 'components/button/button';
import Card from 'components/card/card';
import DropDown from 'components/dropDown/dropDown';
import Input from 'components/input/input';
import Label from 'components/label/label';
import PropTypes from 'prop-types';
import React from 'react';
import './contractSection.less';

class ContractSection extends React.Component {
  renderContractDropDown = () => {
    const {
      contract,
      contracts,
      onChange
    } = this.props;

    return (
      <div className='contract field'>
        <DropDown
          value={contract}
          name='contract'
          onChange={onChange}
          options={contracts.map(ct => ({ name: ct, value: ct }))}
        />
      </div>
    );
  }

  renderDeploymentArea = () => {
    const {
      context,
      contract
    } = this.props;

    const contractData = context
      .drizzle
      .contracts[contract]
      .abi
      .find(el => el.type === 'constructor');

    return (
      <React.Fragment>
        {
          contractData.inputs.map((input, index) => (
            <div
              key={index}
              className='deployment area'
            >
              <Label
                text={input.name}
                style={{
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 0
                }}
              />
              <Input
                key={index}
                placeholder={input.type}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderLeft: 0
                }}
              />
            </div>
          ))
        }
        <Button
          text='Deploy'
          className='deploy button'
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <Card className='contract section'>
        {
          this.renderContractDropDown()
        }
        {
          this.renderDeploymentArea()
        }
      </Card>
    );
  }
}

export default ContractSection;

ContractSection.propTypes = {
  context: PropTypes.object,
  contract: PropTypes.string,
  contracts: PropTypes.array,
  onChange: PropTypes.func
};
