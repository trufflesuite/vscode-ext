import * as assert from "assert";
import * as sinon from "sinon";
import { Handles } from "vscode-debugadapter";
import { OBJECT_VARIABLE_DISPLAY_NAME, SCOPES } from "../../src/debugAdapter/constants/variablesView";
import RuntimeInterface from "../../src/debugAdapter/runtimeInterface";
import VariablesHandler from "../../src/debugAdapter/variablesHandler";

describe("VariablesHandler unit tests", () => {
  const runtimeInterface = new RuntimeInterface();
  afterEach(() => {
    sinon.restore();
  });

  describe("getVariableAttributesByVariableRef - when SCOPES.all.ref is requested", () => {
    it("getVariableAttributesByVariableRef should pass when variables contain array property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [arrayProp.key]: arrayProp.value });
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const containsArrayProp = result.some(
        (e) => e.name === arrayProp.key && e.value === JSON.stringify(arrayProp.value) && e.variablesReference === 0
      );
      assert.strictEqual(containsArrayProp, true, "result should contains array prop");
    });

    it("getVariableAttributesByVariableRef should pass when variables contain boolean property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [boolProp.key]: boolProp.value });
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const containsBoolProp = result.some(
        (e) => e.name === boolProp.key && e.value === JSON.stringify(boolProp.value) && e.variablesReference === 0
      );
      assert.strictEqual(containsBoolProp, true, "result should contains boolProp prop");
    });

    it("getVariableAttributesByVariableRef should pass when variables contain null property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [nullProp.key]: nullProp.value });
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const containsNullProp = result.some(
        (e) => e.name === nullProp.key && e.value === JSON.stringify(nullProp.value) && e.variablesReference === 0
      );
      assert.strictEqual(containsNullProp, true, "result should contains null prop");
    });

    it("getVariableAttributesByVariableRef should pass when variables contain number property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [numProp.key]: numProp.value });
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const containsNumberProp = result.some(
        (e) => e.name === numProp.key && e.value === JSON.stringify(numProp.value) && e.variablesReference === 0
      );
      assert.strictEqual(containsNumberProp, true, "result should contains Number prop");
    });

    it("getVariableAttributesByVariableRef should pass when variables contain object property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [objProp.key]: objProp.value });
      const generateVariablesAttrKeyStub = sinon.stub(VariablesHandler.prototype, "generateVariablesAttrKey" as any);
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const objectVar = result.find((e) => e.name === objProp.key);
      assert.notEqual(objectVar, undefined, "objectVar shouldn't be undefined");
      assert.notStrictEqual(objectVar!.variablesReference, 0, "objectVar's value shouldn't be 0");
      assert.strictEqual(
        objectVar!.value,
        OBJECT_VARIABLE_DISPLAY_NAME,
        `objectVar\'s value should be ${OBJECT_VARIABLE_DISPLAY_NAME}`
      );
      assert.strictEqual(
        generateVariablesAttrKeyStub.calledWith("", objProp.key),
        true,
        "generateVariablesAttrKey should be called with concrete arguments"
      );
    });

    it("getVariableAttributesByVariableRef should call handles.create when variables contain object property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [objProp.key]: objProp.value });
      const variablePath = `/${objProp.key}`;
      const handlesCreateStub = sinon.stub(Handles.prototype, "create").returns(123);
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const objectVar = result.find((e) => e.name === objProp.key);
      assert.notEqual(objectVar, undefined, "objectVar shouldn't be undefined");
      assert.notStrictEqual(objectVar!.variablesReference, 0, "objectVar's value shouldn't be 0");
      assert.strictEqual(
        objectVar!.value,
        OBJECT_VARIABLE_DISPLAY_NAME,
        `objectVar\'s value should be ${OBJECT_VARIABLE_DISPLAY_NAME}`
      );
      assert.strictEqual(
        handlesCreateStub.calledWithMatch(variablePath),
        true,
        `handles.create should be called with ${variablePath} argument`
      );
    });

    it("getVariableAttributesByVariableRef should pass when variables contain string property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [stringProp.key]: stringProp.value });
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const containsStringProp = result.some(
        (e) => e.name === stringProp.key && e.value === JSON.stringify(stringProp.value) && e.variablesReference === 0
      );
      assert.strictEqual(containsStringProp, true, "result should contains String prop");
    });

    it("getVariableAttributesByVariableRef should pass when variables contain undefined property", async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [undefinedProp.key]: undefinedProp.value });
      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const result = await variablesHandler.getVariableAttributesByVariableRef(SCOPES.all.ref);
      // Assert
      const containsUndefinedProp = result.some(
        (e) =>
          e.name === undefinedProp.key && e.value === JSON.stringify(undefinedProp.value) && e.variablesReference === 0
      );
      assert.strictEqual(containsUndefinedProp, true, "result should contains undefined prop");
    });
  });

  it("getVariableAttributesByVariableRef should pass when variableReference is not SCOPE.all.ref", async () => {
    // Arrange
    const nestedVariableReference = 987;
    const nestedObjectTestProperty = { key: "Test", value: "Test" };
    const nestedObjectValue = { [nestedObjectTestProperty.key]: nestedObjectTestProperty.value };
    const nestedObject = { key: "NestedVariable", value: nestedObjectValue };
    const objectVariable = { key: "TestVariable", value: { [nestedObject.key]: nestedObject.value } };
    // variables structure:
    // variables = {
    //   TestVariable: {
    //     NestedVariable: {
    //       Test: 'Test',
    //     },
    //   },
    // }
    sinon.stub(RuntimeInterface.prototype, "variables").resolves({ [objectVariable.key]: objectVariable.value });
    sinon
      .stub(Handles.prototype, "get")
      .withArgs(nestedVariableReference)
      .returns(`/${objectVariable.key}/${nestedObject.key}`);
    // Act
    const variablesHandler = new VariablesHandler(runtimeInterface);
    const result = await variablesHandler.getVariableAttributesByVariableRef(nestedVariableReference);
    const containsNestedObjectProperty = result.some(
      (v) =>
        v.name === nestedObjectTestProperty.key &&
        v.value === JSON.stringify(nestedObjectTestProperty.value) &&
        v.variablesReference === 0
    );
    // Assert
    assert.strictEqual(containsNestedObjectProperty, true, "should contain nestedObjectProperty");
  });

  describe("evaluateExpression", () => {
    it("should pass when expression is simple", async () => {
      // Arrange
      const variableKey = "key";
      const variables = { [variableKey]: "test" };
      sinon.stub(RuntimeInterface.prototype, "variables").resolves(variables);
      const testExpression = variableKey;

      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const evaluatedVar = await variablesHandler.evaluateExpression(testExpression);

      // Assert
      assert.strictEqual(
        evaluatedVar.result,
        JSON.stringify(variables[variableKey]),
        `evaluatedVar.result should be ${variables[variableKey]}`
      );
      assert.strictEqual(evaluatedVar.variablesReference, 0, "evaluatedVar.variablesReference shouldn't be 0");
    });

    it("should pass when expression is complex", async () => {
      // Arrange
      const objectKey = "key";
      const objectProp = "prop";
      const variables = {
        [objectKey]: {
          [objectProp]: "test",
        },
      };
      sinon.stub(RuntimeInterface.prototype, "variables").resolves(variables);
      const testExpression = `${objectKey}.${objectProp}`;

      // Act
      const variablesHandler = new VariablesHandler(runtimeInterface);
      const evaluatedVar = await variablesHandler.evaluateExpression(testExpression);

      // Assert
      const objectPropValue = variables[objectKey][objectProp];
      assert.strictEqual(
        evaluatedVar.result,
        JSON.stringify(objectPropValue),
        `evaluatedVar.result should be ${objectPropValue}`
      );
      assert.strictEqual(evaluatedVar.variablesReference, 0, "evaluatedVar.variablesReference shouldn't be 0");
    });
  });
});

const arrayProp = { key: "arrayProp", value: [1, 2] };
const boolProp = { key: "boolProp", value: true };
const nullProp = { key: "nullProp", value: null };
const numProp = { key: "numProp", value: 123 };
const objProp = { key: "objProp", value: { a: 1 } };
const stringProp = { key: "stringProp", value: "test" };
const undefinedProp = { key: "undefinedProp", value: undefined };
