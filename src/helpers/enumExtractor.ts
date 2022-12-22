// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../Constants';
import {EnumStorage} from '@/Models/EnumStorage';
import {Output, OutputLabel} from '@/Output';
import {Telemetry} from '../Telemetry';

interface INode {
  id: number;
  nodeType: string;
  nodes: INode[];
  name: string;
  typeName: any;
  parameters: any;
}

interface IEnumNode extends INode {
  members: INode[];
}

export function extractEnumsInfoSafe(contractName: string, ast: {[key: string]: any}): EnumStorage {
  try {
    return extractEnumsInfo(contractName, ast);
  } catch (error) {
    if (error instanceof Error) {
      Output.outputLine(OutputLabel.telemetryClient, error.message);
      Telemetry.sendException(error);
    }
  }
  return new EnumStorage();
}

function extractEnumsInfo(contractName: string, ast: {[key: string]: any}): EnumStorage {
  if (!ast) {
    throw new Error(Constants.errorMessageStrings.AstIsEmpty);
  }
  const rootNode = ast.nodes.find(
    (node: INode) => node.nodeType === 'ContractDefinition' && node.name === contractName
  );
  if (!rootNode) {
    throw new Error(Constants.errorMessageStrings.NoContractBody);
  }

  const result = new EnumStorage();
  const enumNodes = GetEnumDeclarations('EnumDefinition', rootNode);
  if (enumNodes.length > 0) {
    const methods = GetMethodsWithEnum(
      'FunctionDefinition',
      rootNode,
      enumNodes.map((enumNode) => enumNode.name)
    );
    methods.forEach((method) => {
      method.parameters.parameters
        .filter((parameter: any) => enumNodes.some((enumItem) => enumItem.name === parameter.typeName.name))
        .forEach((parameter: any) => {
          const enm = enumNodes.find((enumItem) => enumItem.name === parameter.typeName.name)!;
          // first enum element could have not zero value, so we move it to zero-base
          const offset = enm.members[0].id;
          // collect enum items. ids does not equal uint values,
          // so i think we should just set first as '0' and so on
          const enumItems = enm.members.map((enumMember) => ({name: enumMember.name, value: enumMember.id - offset}));
          // method name + parameter name as uniq key
          if (!result.methods[method.name]) {
            result.methods[method.name] = {};
          }
          result.methods[method.name][parameter.name] = enumItems;
        });
    });
    // contract members
    const enumNames = enumNodes.map((enumItems) => enumItems.name);
    const contractMembers = GetEnumMembers('VariableDeclaration', rootNode, enumNames);
    contractMembers.forEach((contractMember) => {
      const enumItemsWithoutOffset = enumNodes.find((enumNode) => enumNode.name === contractMember.typeName.name)!;
      const offset = enumItemsWithoutOffset.members[0].id;
      result.fields[contractMember.name] = enumItemsWithoutOffset.members.map((enumWithoutOffset: any) => ({
        name: enumWithoutOffset.name,
        value: enumWithoutOffset.id - offset,
      }));
    });
  }

  return result;
}

function ContainsEnum(node: INode, enumNames: string[]): boolean {
  return node.parameters.parameters.some(
    (parameter: any) => enumNames.includes(parameter.typeName.name) && parameter.nodeType === 'VariableDeclaration'
  );
}

function GetEnumMembers(nodeType: string, node: INode, enumNames: string[]): INode[] {
  return node.nodes.filter(
    (subnode: INode) => subnode.nodeType === nodeType && enumNames.includes(subnode.typeName.name)
  );
}

function GetMethodsWithEnum(nodeType: string, node: INode, enumNames: string[]): INode[] {
  const storage: INode[] = [];

  if (node.nodeType === nodeType && node.name) {
    storage.push(node);
  }

  if (node.nodes && node.nodes.length > 0) {
    node.nodes.forEach((subnode) => {
      GetMethodsWithEnum(nodeType, subnode, enumNames)
        .filter((methodNode) => ContainsEnum(methodNode, enumNames))
        .forEach((methodNode) => storage.push(methodNode));
    });
  }

  return storage;
}

function GetEnumDeclarations(nodeType: string, node: INode): IEnumNode[] {
  const storage: IEnumNode[] = [];

  if (node.nodeType === nodeType) {
    storage.push(node as IEnumNode);
  }

  if (node.nodes) {
    node.nodes.forEach((subnode) => {
      const res = GetEnumDeclarations(nodeType, subnode);
      storage.push(...res);
    });
  }

  return storage;
}
