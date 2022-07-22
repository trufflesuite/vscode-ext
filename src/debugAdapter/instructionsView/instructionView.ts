// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {TreeView, window} from 'vscode';
import {IInstruction} from '../models/IInstruction';
import InstructionDataManager from './instructionDataManager';
import InstructionDataProvider from './instructionDataProvider';
import InstructionTreeNode from './instructionTreeNode';

const INSTRUCTION_VIEW_ID = 'truffle-vscode.InstructionView';

export default class InstructionView {
  private view: TreeView<InstructionTreeNode>;
  private dataProvider: InstructionDataProvider;
  constructor() {
    const dataManager = new InstructionDataManager();
    this.dataProvider = new InstructionDataProvider(dataManager);
    this.view = window.createTreeView(INSTRUCTION_VIEW_ID, {
      treeDataProvider: this.dataProvider,
      showCollapseAll: true,
    });
  }

  public update(element: InstructionTreeNode, newInstructions: IInstruction[]) {
    this.dataProvider.refresh(element, newInstructions);
  }

  public revealInstruction(instruction: IInstruction): InstructionTreeNode {
    const treeNode = new InstructionTreeNode(undefined, undefined, instruction);
    if (this.view.visible) {
      this.view.reveal(treeNode, {focus: true, select: true, expand: true});
    }
    return treeNode;
  }

  getRootElement(): InstructionTreeNode {
    return this.view.selection[0];
  }
}
