// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export const EVENT_TYPES = {
  breakpointValidated: 'breakpointValidated',
  end: 'end',
  launched: 'launched',
  stopOnBreakpoint: 'stopOnBreakpoint',
  stopOnEntry: 'stopOnEntry',
  stopOnException: 'stopOnException',
  stopOnStepIn: 'stopOnStepIn',
  stopOnStepOut: 'stopOnStepOut',
  stopOnStepOver: 'stopOnStepOver',
  stopped: 'stopped',
};

export const EVENT_REASONS = {
  breakpoint: 'breakpoint',
  changed: 'changed',
  entry: 'entry',
  exception: 'exception',
  stepIn: 'stepin',
  stepOut: 'stepout',
  stepOver: 'step',
};

// we don't support multiple threads, so we can use a hardcoded ID for the default thread
export const MAIN_THREAD = {
  id: 1,
  name: 'thread 1',
};

export const EVALUATE_REQUEST_TYPES = {
  hover: 'hover',
  watch: 'watch',
};

export const DEBUG_TYPE = 'truffle';

export const EMBED_DEBUG_ADAPTER = typeof (IS_BUNDLE_TIME) === 'undefined' || IS_BUNDLE_TIME === false;

export const ERROR_MESSAGE_ID = 1;
