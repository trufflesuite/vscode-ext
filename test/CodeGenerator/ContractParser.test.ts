// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import * as fs from "fs-extra";
import * as sinon from "sinon";
import { parseSolidityContract } from "../../src/Generators/CodeGenerator/ContractParser";

describe("ContractParser", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("parser should return necessary functions and variables.", async () => {
    // Arrange
    sinon.stub(fs, "readFileSync").returns(contractMetadata);

    // Act
    const { variables, functionsDefinitions } = parseSolidityContract("");

    // Assert
    assert.strictEqual(functionsDefinitions.length, 8, "Array should have only public and external functions");
    assert.strictEqual(variables.length, 4, "Array should have only public variables");
  });
});

const contractMetadata = `pragma solidity ^0.5.0;

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

  // constructor function
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
