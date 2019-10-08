// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { ItemType } from '../ItemType';
import { Project } from './Project';

export class LocalProject extends Project {
  public readonly port: number;

  constructor(label: string, port: number) {
    super(
      ItemType.LOCAL_PROJECT,
      label,
      Constants.treeItemData.project.local,
    );

    this.port = port;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.port = this.port;

    return obj;
  }
}
