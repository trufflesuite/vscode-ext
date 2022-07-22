// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IInstruction} from '../models/IInstruction';
import InstructionTreeNode from './instructionTreeNode';

export default class InstructionDataManager {
  private instructionObject: any = {};

  public load(instructions: IInstruction[]) {
    this.instructionObject = this.mapInstructionsArrayToObject(instructions);
  }

  public getChidren(element?: InstructionTreeNode): string[] {
    if (!element) {
      return Object.keys(this.instructionObject).map((k) => k);
    }

    const item = this.getItemByPath(element.getPaths());
    if (item === undefined) {
      return [];
    }
    return Object.keys(item);
  }

  public getItem(element: InstructionTreeNode): any {
    return this.getItemByPath(element.getPaths());
  }

  public getItemParent(element: InstructionTreeNode): any {
    return this.getItemByPath(element.getParentPaths());
  }

  // Map from array to object in order to used in view
  // [{pc:1,op: ''},{pc:2,op:''}] ==> { 1:{pc:1,op:''}, 2:{pc:2,op:''}}
  private mapInstructionsArrayToObject(steps: IInstruction[]): any {
    const res: any = {};
    steps.forEach((s) => {
      res[s.pc] = s;
    });

    return res;
  }

  private getItemByPath(paths: string[]): any {
    if (paths.length === 0) {
      return void 0;
    }
    let item = this.instructionObject;
    paths.forEach((key) => {
      item = item[key];
    });
    return item;
  }
}
