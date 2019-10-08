// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import App from './App';
import { Drizzle } from 'drizzle';
import { DrizzleContext } from 'drizzle-react';
import { LocalStorage } from 'polyfills/localStorage';
import { newContextComponents } from 'drizzle-react-components';
import React from 'react';
import { render } from 'react-dom';

const storage = new LocalStorage();

window.ls = new Proxy(storage, {
  set: (_, prop, value) => {
    if (LocalStorage.prototype.hasOwnProperty(prop)) {
      storage[prop] = value;
    } else {
      storage.setItem(prop, value);
    }

    return true;
  },

  get: (_, name) => {
    if (LocalStorage.prototype.hasOwnProperty(name)) {
      return storage[name];
    }
    if (storage.values.has(name)) {
      return storage.getItem(name);
    }

    return undefined;
  },
});

Drizzle.prototype.deleteAllContracts = function () {
  Object.keys(this.contracts)
    .forEach(contractName => this.deleteContract(contractName));
};

newContextComponents.ContractForm.prototype.handleInputChange = function (event) {
  const value = event.target.type === 'checkbox'
    ? event.target.checked
    : event.target.value;
  this.setState({ [event.target.name]: value });
};

const options = { contracts: [] };
const drizzle = new Drizzle(options);

render(
  <DrizzleContext.Provider drizzle={drizzle}>
    <App />
  </DrizzleContext.Provider>,
  document.getElementById('root')
);
