import ContractSection from 'pages/smartContract/components/contractSection/contractSection';
import DeployedContracts from 'pages/smartContract/components/deployedContracts/deployedContracts';
import { DrizzleContext } from 'drizzle-react';
import PropTypes from 'prop-types';
import React from 'react';
import SettingsSection from 'pages/smartContract/components/settingsSection/settingsSection';
import TransactionSection from 'pages/smartContract/components/transactionSection/transactionSection';
import './smartContract.less';

class SmartContract extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,

      account: undefined,
      contract: undefined,

      accounts: [],
      contracts: [],

      environment: 'JavaScript VM',
      gasLimit: 3000000,
      value: 0,
      valueType: 'wei'
    };
  }

  componentDidUpdate() {
    const { loading } = this.state;
    const { drizzleState, initialized } = this.props.context;

    if (!initialized && !loading) {
      this.setState({
        loading: true
      });
    }

    if (!initialized) return;

    const newState = { loading: false };

    newState.accounts = Object.values(drizzleState.accounts);
    newState.contracts = Object.keys(drizzleState.contracts);

    newState.account = this.state.account || newState.accounts[0];
    newState.contract = this.state.contract || newState.contracts[0];

    if (
      newState.account !== this.state.account
      || newState.contract !== this.state.contract
      || newState.accounts.some((el, index) => el !== this.state.accounts[index])
      || newState.contracts.some((el, index) => el !== this.state.contracts[index])
    ) {
      this.setState(newState);
    }
  }

  onChange = (e) => {
    const { name, value } = e.target;

    this.setState({
      [name]: value
    });
  }

  render() {
    const {
      loading,

      account,
      contract,

      accounts,
      contracts,

      environment,
      gasLimit,
      value,
      valueType
    } = this.state;

    if (loading || !contract) {
      return <div className='loading' >Loading Drizzle...</div>;
    }

    return (
      <div className='smart contract'>
        <SettingsSection
          environment={environment}
          account={account}
          accounts={accounts}
          gasLimit={gasLimit}
          value={value}
          valueType={valueType}
          onChange={this.onChange}
        />
        <ContractSection
          context={this.props.context}
          contract={contract}
          contracts={contracts}
          onChange={this.onChange}
        />
        <TransactionSection />
        <DeployedContracts />
      </div>
    );
  }
}

const Wrapper = (props) => <DrizzleContext.Consumer>
  {context => <SmartContract {...props} context={context} />}
</DrizzleContext.Consumer>;

export default Wrapper;

SmartContract.propTypes = {
  context: PropTypes.object.isRequired
};
