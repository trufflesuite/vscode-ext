// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Handles, Scope} from '@vscode/debugadapter';
import {DebugProtocol} from '@vscode/debugprotocol';
import _ from 'lodash';
import {TranslatedResult} from './helpers';
import {IExpressionEval} from './models/IExpressionEval';
import RuntimeInterface from './runtimeInterface';

/**
 * > **NOTE**. _This is only `export`ed to be used in tests._
 */
export const SCOPES = {
  all: {
    name: 'All',
    ref: 1,
  },
  dynamicVariables: {
    ref: 2,
  },
};

/**
 * > **NOTE**. _This is only `export`ed to be used in tests._
 */
export const OBJECT_VARIABLE_DISPLAY_NAME = 'Object';

export default class VariablesHandler {
  private _runtime: RuntimeInterface;
  private readonly _scopes: Scope[];
  private readonly _handles: Handles<string>;

  constructor(runtime: RuntimeInterface) {
    this._runtime = runtime;
    this._scopes = new Array<Scope>();
    this._scopes.push(new Scope(SCOPES.all.name, SCOPES.all.ref, false));
    this._handles = new Handles<string>(SCOPES.dynamicVariables.ref);
  }

  public getScopes(): Scope[] {
    return this._scopes;
  }

  public getHandles(): Handles<string> {
    return this._handles;
  }

  public async getVariableAttributesByVariableRef(variablesReference: number): Promise<DebugProtocol.Variable[]> {
    let result: DebugProtocol.Variable[];
    let variables: Record<string, TranslatedResult>;
    let variablePath = '';
    switch (variablesReference) {
      case SCOPES.all.ref:
        variables = await this._runtime.variables();
        result = this.mapToDebuggableVariables(variablePath, variables);
        break;
      default:
        // requesting object variable
        variablePath = this._handles.get(variablesReference);
        variables = await this._runtime.variables();
        variables = VariablesHandler.getVariableAttributesByKeyPath(variablePath, variables);
        result = this.mapToDebuggableVariables(variablePath, variables);
    }

    return result;
  }

  // expression = "attribute"
  // expression = "parent.childA.child1"
  public async evaluateExpression(expression: string): Promise<IExpressionEval> {
    const variablesObj = await this._runtime.variables();
    const variable = VariablesHandler.getVariableAttributesByKeyPath(expression, variablesObj);
    const isObjType = VariablesHandler.isSpecificObjectTypeValue(variable, typeof variable);
    return {
      result: VariablesHandler.getDisplayValue(variable, isObjType),
      variablesReference: isObjType ? this._handles.create(this.generateVariablesAttrKey('', expression)) : 0,
    };
  }

  // generate "path.to.attribute"
  private generateVariablesAttrKey(variablePath: string, attribute: string): string {
    if (_.isEmpty(variablePath)) {
      return attribute;
    } else {
      return `${_.trimStart(variablePath, '.')}.${attribute}`;
    }
  }

  /**
   * This will translate the internal variables to the DebugProtocol equivalent. This is used for UI representation fixes.
   *
   * @param variablePath
   * @param variable
   * @returns
   */
  private mapToDebuggableVariables(
    variablePath: string,
    variable: Record<string, TranslatedResult>
  ): DebugProtocol.Variable[] {
    const result: DebugProtocol.Variable[] = [];
    for (const attr in variable) {
      // remove our metadata fields...
      if (variable.hasOwnProperty(attr) && attr !== 'typeName') {
        const value = variable[attr];
        result.push(this.buildResult(value, attr, variablePath));
      }
    }
    return result;
  }

  private buildResult(value: TranslatedResult, attr: string, variablePath: string): DebugProtocol.Variable {
    const type = typeof value;
    const isRef = VariablesHandler.isSpecificObjectTypeValue(value, type);
    return {
      name: attr,
      type,
      value: VariablesHandler.getDisplayValue(value, isRef),
      variablesReference: isRef ? this._handles.create(this.generateVariablesAttrKey(variablePath, attr)) : 0,
    };
  }

  private static getDisplayValue = (obj: TranslatedResult, isSpecificObjectType: boolean) =>
    isSpecificObjectType ? obj.typeName || OBJECT_VARIABLE_DISPLAY_NAME : JSON.stringify(obj);

  private static getVariableAttributesByKeyPath = (
    keyPath: string,
    variable: Record<string, TranslatedResult>
  ): any => {
    try {
      return _.get(variable, keyPath);
    } catch (e) {
      return {} as TranslatedResult;
    }
  };

  private static isSpecificObjectTypeValue = (value: any, valueType: string) =>
    !Array.isArray(value) && value !== null && value !== undefined && valueType === 'object';
}
