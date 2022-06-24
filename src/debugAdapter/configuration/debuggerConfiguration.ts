// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {debug, ExtensionContext} from 'vscode';
import {DEBUG_TYPE, EMBED_DEBUG_ADAPTER} from '../constants/debugAdapter';
import DebugAdapterTrackerFactory from '../debugAdapterTracker/debugAdapterTrackerFactory';
import DebugAdapterDescriptorFactory from './debugAdapterDescriptorFactory';
import DebuggerConfigurationProvider from './debugConfigurationProvider';

export class DebuggerConfiguration {
  public static initialize(context: ExtensionContext) {
    const debugConfigProvider = new DebuggerConfigurationProvider();
    context.subscriptions.push(debug.registerDebugConfigurationProvider(DEBUG_TYPE, debugConfigProvider));

    if (EMBED_DEBUG_ADAPTER) {
      const factory = new DebugAdapterDescriptorFactory();
      context.subscriptions.push(debug.registerDebugAdapterDescriptorFactory(DEBUG_TYPE, factory));
      context.subscriptions.push(factory);
    }

    const debugAdapterTrackerFactory = new DebugAdapterTrackerFactory();
    const trackerFactory = debug.registerDebugAdapterTrackerFactory(DEBUG_TYPE, debugAdapterTrackerFactory);
    context.subscriptions.push(trackerFactory);
  }
}
