// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import {
  FunctionDefinition,
  parse,
  SourceUnit,
  StateVariableDeclaration,
  VariableDeclaration,
  visit,
} from 'solidity-parser-antlr';

export function parseSolidityContract(solFilePath: string)
  : { variables: VariableDeclaration[], functionsDefinitions: FunctionDefinition[] } {
  const ast = parseFileToAstNode(solFilePath);
  const functionArray: FunctionDefinition[] = [];
  const stateVariableArray: VariableDeclaration[] = [];

  visit(ast, {
    StateVariableDeclaration(node: StateVariableDeclaration) {
      for (const variable of node.variables) {
        if (variable.visibility === 'public') {
          stateVariableArray.push(variable);
        }
      }
    },
    FunctionDefinition(node: FunctionDefinition) {
      if (!node.isConstructor && (node.visibility === 'public' || node.visibility === 'external')) {
        functionArray.push(node);
      }
    },
  });

  return { variables: stateVariableArray, functionsDefinitions: functionArray };
}

function parseFileToAstNode(solFilePath: string) {
  const solFileContent = fs.readFileSync(solFilePath, 'utf8');
  return parse(solFileContent, {}) as SourceUnit;
}
