import { Handles, Scope } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { SCOPES } from './constants/variablesView';
import { IExpressionEval } from './models/IExpressionEval';
import RuntimeInterface from './runtimeInterface';

export default class VariablesHandler {
    private _runtime: RuntimeInterface;
    private _scopes: Scope[];
    private _handlers: Handles<string>;

    constructor(runtime: RuntimeInterface) {
        this._runtime = runtime;
        this._scopes = new Array<Scope>();
        this._scopes.push(new Scope(SCOPES.all.name, SCOPES.all.ref, false));
        this._handlers = new Handles<string>(SCOPES.dynamicVariables.ref);
    }

    public getScopes(): Scope[] {
        return this._scopes;
    }

    public getHandlers(): Handles<string> {
        return this._handlers;
    }

    public async getVariableAttributesByVariableRef(variablesReference: number)
    : Promise<DebugProtocol.Variable[]> {
        let result: DebugProtocol.Variable[] = [];
        let variable: any;
        let variablePath: string = '';
        switch (variablesReference) {
            case SCOPES.all.ref:
                variable = await this._runtime.variables();
                result = this.mapToDebuggableVariables(variablePath, variable);
                break;
            default: // requesting object variable
                variablePath = this._handlers.get(variablesReference);
                variable = await this._runtime.variables();
                variable = this.getVariableAttriburesByKeyPath(variablePath, variable);

                result = this.mapToDebuggableVariables(variablePath, variable);
        }

        return result;
    }

    // expression = "attribute"
    // expression = "parent.childA.child1"
    public async evaluateExpression(expression: string): Promise<IExpressionEval> {
        const variablesObj = await this._runtime.variables();
        const variable = this.getVariableAttriburesByKeyPath(expression, variablesObj);
        const isObjType = this.isSpecificObjectTypeValue(variable, typeof(variable));
        const isUndefinedOrNull = (v: any) => (v === undefined || v === null);
        return {
            result: isObjType
                ? 'Object'
                : isUndefinedOrNull(variable)
                    ? typeof(variable)
                    : variable.toString(),
            variablesReference: isObjType
                ? this._handlers.create(this.generateVariablesAttrKey('', expression))
                : 0,
        };
    }

    private isSpecificObjectTypeValue(value: any, valueType: string) {
        return !Array.isArray(value)
            && value !== null
            && value !== undefined
            && valueType === 'object';
    }

    // replace "." by "/" and generate "path/to/variable"
    private generateVariablesAttrKey(variablePath: string, attribute: string): string {
        return `${variablePath.replace(/\./g, '/')}/${attribute.replace(/\./g, '/')}`;
    }

    private getVariableAttriburesByKeyPath(keyPath: string, variable: any): any {
        // keyPath = "/parent/childA/child1"
        // or keyPath = "parent.childA.child1"
        let keys = keyPath.split(/\/|\./);
        if (keys[0] === '') {
            keys = keys.slice(1);
        }
        try {
            keys.forEach((key) => {
                variable = variable[key];
            });
        } catch (e) {
            return undefined;
        }
        return variable;
    }

    private mapToDebuggableVariables(variablePath: string, variable: any): DebugProtocol.Variable[] {
        const result: DebugProtocol.Variable[] = [];
        for (const attr in variable) {
            if (variable.hasOwnProperty(attr)) {
                const value = variable[attr];
                const type = typeof (value);
                const isRef = this.isSpecificObjectTypeValue(value, type);
                result.push({
                    name: attr,
                    type,
                    value: isRef ? 'Object' : JSON.stringify(value),
                    variablesReference: isRef
                        ? this._handlers.create(this.generateVariablesAttrKey(variablePath, attr))
                        : 0,
                });
            }
        }

        return result;
    }
}
