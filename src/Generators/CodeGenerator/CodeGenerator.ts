// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {
  getActionFlowAppTemplate,
  getActionLogicAppTemplate,
  getActionResponseTemplate,
  getCaseTemplate,
  getClientDataTemplate,
  getConnectionReferenceTemplate,
  getConnectionValueTemplate,
  getDefinitionTemplate,
  getFlowAppTemplate,
  getLogicAppTemplate,
  getSwitchTemplate,
} from "./ApplicationDto";
import { parseSolidityContract } from "./ContractParser";

const propertyFunctionName = "methodOrState";
const propertyInputParameters = "inputParameters";
const propertyBlockchainethereum = "blockchainethereum";

export function generateLogicAppForMicroservice(
  abi: string,
  contractAddress: string,
  subscriptionId: string,
  location: string,
  solFilePath: string
) {
  const { variables, functionsDefinitions } = parseSolidityContract(solFilePath);

  const logicApp = getLogicAppTemplate();
  const definition = getDefinitionTemplate();
  const switchBlock = getSwitchTemplate();

  for (const item of [...variables, ...functionsDefinitions]) {
    const actions: { [key: string]: any } = {};
    const action = getActionLogicAppTemplate();
    const bodyParameters: { [key: string]: any } = {};

    if (item.type === "FunctionDefinition") {
      for (const parameter of item.parameters) {
        bodyParameters[parameter.name] = `@triggerBody()?['${propertyInputParameters}']?['${parameter.name}']`;
      }

      action.inputs.path = `/contract/functions/@{encodeURIComponent(encodeURIComponent('${item.name}'))}/execute`;
    } else {
      action.inputs.path = `/contract/functions/@{encodeURIComponent(encodeURIComponent('${item.name}'))}/query`;
    }

    action.inputs.body = bodyParameters;
    action.inputs.queries.abi = abi;
    action.inputs.queries.contractAddress = contractAddress;
    action.inputs.host.connection.name = `@parameters('$connections')['${propertyBlockchainethereum}']['connectionId']`;

    const actionResponse = getActionResponseTemplate();
    actionResponse.inputs.body = `@body('${item.name}')`;
    actionResponse.runAfter[item.name!] = ["Succeeded"];

    actions[item.name!] = action;
    actions[`${item.name}Response`] = actionResponse;

    const caseBlock = getCaseTemplate();
    caseBlock.case = item.name!;
    caseBlock.actions = actions;

    switchBlock.Switch.cases[`Case_${item.name}`] = caseBlock;
  }

  switchBlock.Switch.expression = `@triggerBody()?['${propertyFunctionName}']`;

  definition.actions = switchBlock;
  definition.triggers.manual.inputs.schema.properties[propertyInputParameters] = { type: "object" };
  definition.triggers.manual.inputs.schema.properties[propertyFunctionName] = { type: "string" };

  logicApp.definition = definition;

  logicApp.parameters.$connections.value[propertyBlockchainethereum] = getConnectionValueTemplate();
  logicApp.parameters.$connections.value[
    propertyBlockchainethereum
  ].connectionId = `/subscriptions/${subscriptionId}/resourceGroups/`;
  logicApp.parameters.$connections.value[
    propertyBlockchainethereum
  ].id = `/subscriptions/${subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/blockchainethereum`;

  return logicApp;
}

export function generateFlowAppForMicroservice(
  name: string,
  abi: string,
  contractAddress: string,
  solFilePath: string
) {
  const { variables, functionsDefinitions } = parseSolidityContract(solFilePath);

  const flowApp = getFlowAppTemplate();
  const definition = getDefinitionTemplate();
  const switchBlock = getSwitchTemplate();
  const connectionReferenceName = `shared_${propertyBlockchainethereum}`;

  for (const item of [...variables, ...functionsDefinitions]) {
    const actions: { [key: string]: any } = {};
    const bodyParameters: { [key: string]: any } = {};
    const action = getActionFlowAppTemplate();
    const actionResponseData = getActionResponseTemplate();

    if (item.type === "FunctionDefinition") {
      for (const parameter of item.parameters) {
        bodyParameters[parameter.name] = `@triggerBody()?['${propertyInputParameters}']?['${parameter.name}']`;
        action.inputs.parameters[`parameters/${parameter.name}`] = `${propertyInputParameters}.${parameter.name}`;
      }

      if (item.stateMutability === "view" || item.stateMutability === "pure") {
        action.inputs.host.operationId = item.parameters.length
          ? "ExecuteSmartContractFunction"
          : "GetSmartContractProperties";
      } else {
        action.inputs.host.operationId = "ExecuteContractFunction";
      }

      actionResponseData.inputs.body = item.returnParameters
        ? `@outputs('${item.name}')?['body/Function Output']`
        : `@body('${item.name}')`;
    } else {
      action.inputs.host.operationId = "GetSmartContractProperties";
      actionResponseData.inputs.body = `@outputs('${item.name}')?['body/${item.name}']`;
    }

    action.inputs.host.connectionName = connectionReferenceName;
    action.inputs.host.apiId = `/providers/Microsoft.PowerApps/apis/${connectionReferenceName}`;

    action.inputs.parameters.contractAddress = contractAddress;
    action.inputs.parameters.functionName = item.name!;
    action.inputs.parameters.abi = abi;

    actionResponseData.runAfter[item.name!] = ["Succeeded"];

    actions[item.name!] = action;
    actions[`${item.name}Response`] = actionResponseData;

    const caseBlock = getCaseTemplate();
    caseBlock.case = item.name!;
    caseBlock.actions = actions;

    switchBlock.Switch.cases[`Case_${item.name}`] = caseBlock;
  }

  switchBlock.Switch.expression = `@triggerBody()?['${propertyFunctionName}']`;

  definition.actions = switchBlock;
  definition.triggers.manual.inputs.schema.properties[propertyInputParameters] = { type: "object" };
  definition.triggers.manual.inputs.schema.properties[propertyFunctionName] = { type: "string" };

  const clientData = getClientDataTemplate();
  clientData.properties.definition = definition;
  clientData.properties.displayName = name;
  clientData.properties.connectionReferences[connectionReferenceName] = getConnectionReferenceTemplate();
  clientData.properties.connectionReferences[
    connectionReferenceName
  ].id = `/providers/Microsoft.PowerApps/apis/${connectionReferenceName}`;

  flowApp.clientdata = JSON.stringify(clientData);
  flowApp.name = name;

  return flowApp;
}
