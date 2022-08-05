// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Disposable, ExtensionContext} from 'vscode';

type ExtensionContextPlus = ExtensionContext & Pick<MockExtensionContext, 'teardown'>;

export class MockExtensionContext implements Partial<ExtensionContext> {
  subscriptions: Disposable[] = [];

  asAbsolutePath = (relativePath: string): string => relativePath;

  static new(): ExtensionContextPlus {
    return new this() as unknown as ExtensionContextPlus;
  }

  teardown() {
    this.subscriptions.forEach((x) => x.dispose());
  }
}
