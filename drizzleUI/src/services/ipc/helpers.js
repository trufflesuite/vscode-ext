// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const getCommandList = commands => commands
  .trim()
  .split(' ')
  .map(command => command.trim());

const execute = (listeners, command, data) => {
  if (listeners.has(command)) {
    const handlers = listeners.get(command);

    handlers.forEach(handler => handler(data));
  }
};

const addToListeners = (listeners, commands, handler) => {
  const commandsList = getCommandList(commands);

  commandsList.forEach(command => {
    if (!listeners.has(command)) {
      listeners.set(command, []);
    }

    const handlers = listeners.get(command);

    handlers.push(handler);
  });
};

const removeFromListeners = (listeners, commands, handler) => {
  const commandsList = getCommandList(commands);

  commandsList.forEach(command => {
    if (listeners.has(command)) {
      if (!handler) {
        listeners.delete(command);
        return;
      }

      let handlers = listeners.get(command);

      handlers = handlers.filter(element => element !== handler);

      listeners.set(command, handlers);
    }
  });
};

const removeAllListers = (listeners, command) => listeners.delete(command);

export const Helpers = {
  execute,
  addToListeners,
  removeFromListeners,
  removeAllListers
};
