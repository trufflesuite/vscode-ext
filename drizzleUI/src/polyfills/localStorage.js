// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class LocalStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    const stringKey = String(key);
    if (this.values.has(stringKey)) {
      return String(this.values.get(stringKey));
    }
    return null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(String(key));
  }

  clear() {
    this.values.clear();
  }

  key(i) {
    return Array.from(this.values.keys())[i];
  }

  get length() {
    return this.values.size;
  }
}
