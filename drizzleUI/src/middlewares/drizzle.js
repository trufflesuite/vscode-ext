// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { EventActions } from 'drizzle';
import { Notifications } from 'services';

export const contractEventNotifier = () => next => action => {
  let message;

  // Workaround. Used to prevent drizzle fallback actions.
  const showErrors = Boolean(window.showErrors) || false;

  if (!showErrors) {
    return next(action);
  }

  if (action.type === EventActions.EVENT_ERROR) {
    message = action.event.returnValues._message;
  } else if (!!action.error) {
    message = action.error.message;
  }

  if (!!message) {
    Notifications.showNotification({ message, type: Notifications.types.error, });
  }

  return next(action);
};
