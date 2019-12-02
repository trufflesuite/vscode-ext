// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import App from './App';
import { contractEventNotifier } from 'middlewares';
import { DrizzleContext } from '@drizzle/react-plugin';
import React from 'react';
import { render } from 'react-dom';
import { Drizzle, generateStore } from '@drizzle/store';

Drizzle.prototype.deleteAllContracts = function () {
  Object.keys(this.contracts)
    .forEach(contractName => this.deleteContract(contractName));
};

const options = { contracts: [] };

const store = generateStore({
  drizzleOptions: options,
  appMiddlewares: [contractEventNotifier]
});

const drizzle = new Drizzle(options, store);

render(
  <DrizzleContext.Provider drizzle={drizzle}>
    <App />
  </DrizzleContext.Provider>,
  document.getElementById('root')
);
