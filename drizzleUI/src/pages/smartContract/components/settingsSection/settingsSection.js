import Card from 'components/card/card';
import DropDown from 'components/dropDown/dropDown';
import Input from 'components/input/input';
import PropTypes from 'prop-types';
import React from 'react';
import './settingsSection.less';

const fieldsStyle = {
  width: '400px'
};

const valueTypeOptions = [
  {
    name: 'wei',
    value: 'wei'
  },
  {
    name: 'gwei',
    value: 'gwei'
  },
  {
    name: 'finney',
    value: 'finney'
  },
  {
    name: 'ether',
    value: 'ether'
  }
];

class SettingsSection extends React.Component {
  renderEnvDropDown = () => {
    const {
      environment
    } = this.props;

    return (
      <div className='env field'>
        <div className='title'>
          <span>Environment</span>
        </div>
        <DropDown
          value={environment}
          style={fieldsStyle}
          options={[{
            name: environment,
            value: environment
          }]}
        />
      </div>
    );
  }

  renderAccountDropDown = () => {
    const {
      account,
      accounts,
      onChange
    } = this.props;

    return (
      <div className='account field'>
        <div className='title'>
          <span>Account</span>
        </div>
        <DropDown
          name='account'
          value={account}
          onChange={onChange}
          options={accounts.map(ac => ({ name: ac, value: ac }))}
          style={fieldsStyle}
        />
      </div>
    );
  }

  renderGasLimitInput = () => {
    const {
      gasLimit,
      onChange
    } = this.props;

    return (
      <div className='gas limit field'>
        <div className='title'>
          <span>Gas limit</span>
        </div>
        <Input
          style={fieldsStyle}
          name='gasLimit'
          type='number'
          value={gasLimit}
          onChange={onChange}
        />
      </div>
    );
  }

  renderValueField = () => {
    const {
      value,
      valueType,
      onChange
    } = this.props;

    return (
      <div className='gas limit field'>
        <div className='title'>
          <span>Value</span>
        </div>
        <div className='fields'>
          <Input
            type='number'
            name='value'
            onChange={onChange}
            value={value}
          />
          <DropDown
            style={{ width: '100px' }}
            name='valueType'
            onChange={onChange}
            value={valueType}
            options={valueTypeOptions}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <Card className='settings section'>
        {
          this.renderEnvDropDown()
        }
        {
          this.renderAccountDropDown()
        }
        {
          this.renderGasLimitInput()
        }
        {
          this.renderValueField()
        }
      </Card>
    );
  }
}

export default SettingsSection;

SettingsSection.propTypes = {
  environment: PropTypes.string,
  account: PropTypes.string,
  accounts: PropTypes.array,
  gasLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  valueType: PropTypes.oneOf(valueTypeOptions.map(el => el.name)),
  onChange: PropTypes.func
};
