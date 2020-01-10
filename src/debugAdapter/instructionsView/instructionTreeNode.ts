// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IInstruction } from '../models/IInstruction';

export default class InstructionTreeNode {
  private key: string;
  private path: string;
  private parent?: InstructionTreeNode;

  constructor(key?: string, parent?: InstructionTreeNode, instructionData?: IInstruction) {
    if (!key && (!instructionData || (!instructionData.pc && instructionData.pc !== 0))) {
      throw new Error('Incorrect input params');
    }

    const nodeKey = instructionData
      ? instructionData.pc.toString()
      : (key || '');
    this.key = nodeKey;
    this.parent = parent;
    this.path = this.generatePath(nodeKey, parent);
  }

  public getId(): string {
    return this.path;
  }

  public getKey(): string {
    return this.key;
  }

  public getParent(): InstructionTreeNode | undefined {
    return this.parent;
  }

  public getParentPaths(): string[] {
    return this.path.split(/\//).slice(1, this.path.length - 1); // not take first empty element and last
  }

  public getPaths(): string[] {
    return this.path.split(/\//).slice(1); // not take first empty element
  }

  private generatePath(key: string, parent?: InstructionTreeNode) {
    const parentPath = parent ? parent.path : '';
    return `${parentPath}/${key}`;
  }
}
