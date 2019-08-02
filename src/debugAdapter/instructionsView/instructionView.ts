import { TreeView, window } from 'vscode';
import { IInstruction } from '../models/IInstruction';
import InstructionDataManager from './instructionDataManager';
import InstructionDataProvider from './instructionDataProvider';
import InstructionTreeNode from './instructionTreeNode';

const INSTRUCTION_VIEW_ID = 'InstructionView';

export default class InstructionView {
    private view: TreeView<InstructionTreeNode>;
    private dataProvider: InstructionDataProvider;
    constructor() {
        const dataManager = new InstructionDataManager();
        this.dataProvider = new InstructionDataProvider(dataManager);
        this.view = window.createTreeView(INSTRUCTION_VIEW_ID,
            { treeDataProvider: this.dataProvider, showCollapseAll: true });
    }

    public update(newInstructions: IInstruction[]) {
        this.dataProvider.refresh(newInstructions);
    }

    public revealInstruction(instruction: IInstruction) {
        if (this.view.visible) {
            const treeNode = new InstructionTreeNode(undefined, undefined, instruction);
            this.view.reveal(treeNode, { focus: true, select: true, expand: true });
        }
    }
}
