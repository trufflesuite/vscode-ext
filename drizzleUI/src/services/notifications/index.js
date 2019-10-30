// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IPC } from '../ipc';

const types = {
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const showNotification = ({ message, type }) => {
  IPC.postMessage('notification', { message, type });
};

export const Notifications = {
  showNotification,
  types
};
