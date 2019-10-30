// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Helpers } from './helpers';

// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();

const listeners = new Map();
const onceListeners = new Map();

const on = (commands, handler) => Helpers.addToListeners(listeners, commands, handler);

const once = (commands, handler) => Helpers.addToListeners(onceListeners, commands, handler);

const off = (commands, handler) => {
  Helpers.removeFromListeners(listeners, commands, handler);
  Helpers.removeFromListeners(onceListeners, commands, handler);
};

const postMessage = (command, value) => vscode.postMessage({ command, value });

const messageReceived = (event) => {
  const { command, value: data } = event.data;

  Helpers.execute(listeners, command, data);
  Helpers.execute(onceListeners, command, data);

  Helpers.removeAllListers(onceListeners, command);
};

window.addEventListener('message', messageReceived, false);

export const IPC = {
  on,
  once,
  off,
  postMessage
};
