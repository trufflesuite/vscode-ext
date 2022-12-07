// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
import {Memento} from 'vscode';

export class MockMemento implements Memento {
  constructor(private dict: {[id: string]: any} = {}) {}

  // // _value must be named this way in order to match vscode's memento
  // private _value: Record<string, any> = {};

  public get(key: any, defaultValue?: any): any;
  public get<T>(key: string, defaultValue?: T): T {
    const exists = this.dict.hasOwnProperty(key);
    return exists ? this.dict[key] : (defaultValue! as any);
  }

  public update(key: string, value: any): Thenable<void> {
    this.dict[key] = value;
    return Promise.resolve();
  }
  public clear() {
    this.dict = {};
  }

  keys(): readonly string[] {
    return Object.keys(this.dict);
  }
}
