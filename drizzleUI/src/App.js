import { Drizzle } from 'drizzle';
import { DrizzleContext } from 'drizzle-react';
import drizzleOptions from './drizzleOptions';
import React from '../node_modules/react';
import SmartContract from './pages/smartContract/smartContract';
import './app.less';

class App extends React.Component {
  render() {
    const drizzle = new Drizzle(drizzleOptions);

    if (drizzleOptions.contracts.length === 0) {
      return (<p>No contracts are available</p>);
    }

    return (
      <DrizzleContext.Provider drizzle={drizzle}>
        <SmartContract />
      </DrizzleContext.Provider>
    );
  }
}

export default App;
