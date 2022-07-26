// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export class EnumStorage {
  // contains enums for contract's fields
  public fields: {[key: string]: IEnumItem[]} = {};

  // contains enums for method's arguments from contract
  public methods: {[key: string]: IMethod} = {};
}

interface IMethod {
  [key: string]: IEnumItem[];
}

interface IEnumItem {
  value: number;
  name: string;
}
