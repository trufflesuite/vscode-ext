import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { IInstruction } from '../models/IInstruction';
import InstructionDataManager from './instructionDataManager';
import InstructionTreeNode from './instructionTreeNode';

export default class InstructionDataProvider implements TreeDataProvider<InstructionTreeNode> {
    public _onDidChangeTreeData: EventEmitter<InstructionTreeNode> = new EventEmitter<InstructionTreeNode>();
    public readonly onDidChangeTreeData: Event<InstructionTreeNode> = this._onDidChangeTreeData.event;

    private instructionDataManager: InstructionDataManager;

    constructor(instructionDataManager: InstructionDataManager) {
        this.instructionDataManager = instructionDataManager;
    }

    public refresh(newInstructions: IInstruction[]) {
        this.instructionDataManager.load(newInstructions);
        this._onDidChangeTreeData.fire();
    }

    public getChildren(element?: InstructionTreeNode): ProviderResult<InstructionTreeNode[]> {
        const items = this.instructionDataManager.getChidren(element);
        return items.map((e) => new InstructionTreeNode(e, element));
    }

    public getTreeItem(element: InstructionTreeNode): TreeItem {
        const item = this.instructionDataManager.getItem(element);
        const isSpecificObjectValueType = this.isSpecificObjectValueType(item);
        const collapsibleState = isSpecificObjectValueType
            ? TreeItemCollapsibleState.Collapsed
            : TreeItemCollapsibleState.None;

        return {
            collapsibleState,
            id: element.getId(),
            label: this.generateTreeItemLabel(element.getKey(), item, isSpecificObjectValueType),
        };
    }

    public getParent(element: InstructionTreeNode): ProviderResult<InstructionTreeNode> {
        return element.getParent();
    }

    private generateTreeItemLabel(treeItemKey: string, treeItemValue: any, isSpecificObjectValueType: boolean) {
        return isSpecificObjectValueType
            ? treeItemKey
            : `${treeItemKey}: ${JSON.stringify(treeItemValue)}`;
    }

    // TODO: refactroign - same method in variablesHandler
    private isSpecificObjectValueType(item: any) {
        return !Array.isArray(item)
            && item !== null
            && item !== undefined
            && typeof(item) === 'object';
    }
}
