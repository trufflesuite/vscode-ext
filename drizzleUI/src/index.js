// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import App from './App';
import { contractEventNotifier } from 'middlewares';
import { DrizzleContext } from '@drizzle/react-plugin';
import { LocalStorage } from 'polyfills/localStorage';
import React from 'react';
import { render } from 'react-dom';
import { Drizzle, generateStore } from '@drizzle/store';

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
