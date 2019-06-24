// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Memento } from 'vscode';

export class FakeExtensionState implements Memento {
  constructor(private dict: { [id: string]: any} ) {
    dict = {};
  }
  public get<T>(key: string): T | undefined {
    return this.dict[key] as T;
  }

  public update(key: string, value: any): Thenable<void> {
    return this.dict[key] = value;
  }
}