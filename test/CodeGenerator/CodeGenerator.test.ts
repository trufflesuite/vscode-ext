// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import uuid = require('uuid');
import { generateFlowAppForMicroservice, generateLogicAppForMicroservice } from '../../src/Generators/CodeGenerator/CodeGenerator';

describe('CodeGenerator', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('generateLogicAppForMicroservice should return logic app data for microservice.', async () => {
    // Arrange
    sinon.stub(fs, 'readFileSync').returns(contractWithDifferentTypeOfVariableAndFunction);

    // Act
    const logicAppData = generateLogicAppForMicroservice('abi', 'contract address', 'subscriptionId', 'location', '');

    // Assert
    assert.strictEqual(
      Object.keys((logicAppData.definition as any).actions.Switch.cases).length,
      12,
      'logicAppData should have special count of cases.');
  });

  it('generateFlowAppForMicroservice should return flow app data for microservice.', async () => {
    // Arrange
    sinon.stub(fs, 'readFileSync').returns(contractWithDifferentTypeOfVariableAndFunction);
    const testContractName = uuid.v4().toString();

    // Act
    const flowAppData = generateFlowAppForMicroservice(testContractName, '[]', 'contract address', '');
    const clientData = JSON.parse(flowAppData.clientdata);

    // Assert
    assert.strictEqual(
      Object.keys(clientData.properties.definition.actions.Switch.cases).length,
      12,
      'flowAppData should have special count of cases');
    assert.strictEqual(flowAppData.name, testContractName, 'Name should equals parameter which we send to function.');
  });

  it('generateFlowAppForMicroservice should return flow app data with special operationId for functions.',
  async () => {
    // Arrange
    sinon.stub(fs, 'readFileSync').returns(contractWithDifferentAccessOfFunctions);
    const testContractName = uuid.v4().toString();

    // Act
    const flowAppData = generateFlowAppForMicroservice(testContractName, '[]', 'contract address', '');

    // Assert
    const cases = JSON.parse(flowAppData.clientdata).properties.definition.actions.Switch.cases;
    const casesPropertyNames = Object.getOwnPropertyNames(cases);

    const simpleFunctionNames = casesPropertyNames.filter((name) => !name.includes('View') && !name.includes('Pure'));
    const viewPureFunctionNames = casesPropertyNames.filter((name) => name.includes('View') || name.includes('Pure'));
    const viewPureFunctionNamesWithParameters = viewPureFunctionNames.filter((name) => !name.includes('NOTParam'));
    const viewPureFunctionNamesWithoutParameters = viewPureFunctionNames.filter((name) => name.includes('NOTParam'));

    const functionNamesWithReturnValue = casesPropertyNames.filter((name) => !name.includes('NOTReturn'));
    const functionNamesWithoutReturnValue = casesPropertyNames.filter((name) => name.includes('NOTReturn'));

    viewPureFunctionNamesWithParameters.forEach((name) => {
      const functionName = name.replace(/Case_/, '');
      assert.strictEqual(
        cases[name].actions[functionName].inputs.host.operationId,
        'ExecuteSmartContractFunction',
        'Case should have operationId equals `ExecuteSmartContractFunction`, when function has parameters and modifier access equal `view` or `pure`');
    });

    viewPureFunctionNamesWithoutParameters.forEach((name) => {
      const functionName = name.replace(/Case_/, '');
      assert.strictEqual(
        cases[name].actions[functionName].inputs.host.operationId,
        'GetSmartContractProperties',
        'Case should have operationId equals `GetSmartContractProperties`, when function without parameters has modifier access equal `view` or `pure`');
    });

    simpleFunctionNames.forEach((name) => {
      const functionName = name.replace(/Case_/, '');
      assert.strictEqual(
        cases[name].actions[functionName].inputs.host.operationId,
        'ExecuteContractFunction',
        'Case should have operationId equals `ExecuteContractFunction`, when function does not have modifier access equal `view` or `pure`');
    });

    functionNamesWithReturnValue.forEach((name) => {
      const functionName = name.replace(/Case_/, '');
      assert.strictEqual(
        cases[name].actions[`${functionName}Response`].inputs.body,
        `@outputs('${functionName}')?['body/Function Output']`,
        'Case should have response with body, which return Function Output, when function has return value');
    });

    functionNamesWithoutReturnValue.forEach((name) => {
      const functionName = name.replace(/Case_/, '');
      assert.strictEqual(
        cases[name].actions[`${functionName}Response`].inputs.body,
        `@body('${functionName}')`,
        'Case should have response with body, which return function body, when function does not have return value');
    });
  });
});

const contractWithDifferentTypeOfVariableAndFunction = `pragma solidity ^0.5.0;

contract TestContract
{
  enum StateType { Request, Respond }
  StateType public  State;

  address public  Responder;
  string public RequestMessage;

  event StateChanged(string stateData);

  uint public publicVariable;
  uint private privateVariable;
  uint internal internalVariable;

  constructor(string memory message) public
  {
      RequestMessage = message;
      State = StateType.Request;

      emit StateChanged('Request');
  }

  function public1(uint a) public { a + 1; }
  function public2(uint a) public returns(bool) { a + 1; return true; }
  function public3(uint a) public pure { a + 1; }
  function public4(uint a) public view { a + 1; }
  function public5(uint a) public payable { a + 1; }

  function private1(uint a) private { a + 1; }
  function private2(uint a) private pure { a + 1; }
  function private3(uint a) private view { a + 1; }

  function internal1(uint a) internal { a + 1; }
  function internal2(uint a) internal pure { a + 1; }
  function internal3(uint a) internal view { a + 1; }

  function ext1(uint a) external { a + 1; }
  function ext2(uint a) external pure { a + 1; }
  function ext3(uint a) external view {a + 1; }
}`;

const contractWithDifferentAccessOfFunctions = `pragma solidity ^0.5.0;

contract TestContract {
  constructor() public {}

  function functionNOTParamNOTReturn() public {}

  function functionNOTParamNOTReturnView() public view {}

  function functionNOTParamNOTReturnPure() public pure {}

  function functionNOTParamNOTReturnPayable() public payable {}


  function functionParamNOTReturn(uint a) public { a + 1; }

  function functionParamNOTReturnView(uint a) public view { a + 1; }

  function functionParamNOTReturnPure(uint a) public pure { a + 1; }

  function functionParamNOTReturnPayable(uint a) public payable { a + 1; }


  function functionNOTParamReturn() public returns (uint) { return 1; }

  function functionNOTParamReturnView() public view returns (uint) { return 1; }

  function functionNOTParamReturnPure() public pure returns (uint) { return 1; }

  function functionNOTParamReturnPayable() public payable returns (uint) { return 1; }


  function functionParamReturn(uint input) public returns (uint) { return input; }

  function functionParamReturnView(uint input) public view returns (uint) { return input; }

  function functionParamReturnPure(uint input) public pure returns (uint) { return input; }

  function functionParamReturnPayable(uint input) public payable returns (uint) { return input; }


  function externalfunctionNOTParamNOTReturn() external {}

  function externalfunctionNOTParamNOTReturnView() external view {}

  function externalfunctionNOTParamNOTReturnPure() external pure {}

  function externalfunctionNOTParamNOTReturnPayable() external payable {}


  function externalfunctionParamNOTReturn(uint a) external { a + 1; }

  function externalfunctionParamNOTReturnView(uint a) external view { a + 1; }

  function externalfunctionParamNOTReturnPure(uint a) external pure { a + 1; }

  function externalfunctionParamNOTReturnPayable(uint a) external payable { a + 1; }


  function externalfunctionNOTParamReturn() external returns (uint) { return 1; }

  function externalfunctionNOTParamReturnView() external view returns (uint) { return 1; }

  function externalfunctionNOTParamReturnPure() external pure returns (uint) { return 1; }

  function externalfunctionNOTParamReturnPayable() external payable returns (uint) { return 1; }


  function externalfunctionParamReturn(uint input) external returns (uint) { return input; }

  function externalfunctionParamReturnView(uint input) external view returns (uint) { return input; }

  function externalfunctionParamReturnPure(uint input) external pure returns (uint) { return input; }

  function externalfunctionParamReturnPayable(uint input) external payable returns (uint) { return input; }
}`;
