/* eslint-disable no-case-declarations */
// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Format} from "@truffle/codec";
import {
  AddressValue,
  BoolValue,
  BytesDynamicValue,
  BytesStaticValue,
  BytesValue,
  FixedValue,
  StringValue,
  StringValueInfoMalformed,
  StringValueInfoValid,
  UintValue,
} from "@truffle/codec/dist/lib/format/elementary";
import {ArrayValue, Result} from "@truffle/codec/dist/lib/format/values";
import * as Exception from "@truffle/codec/dist/lib/format/utils/exception";
import {relative as pathRelative, sep as pathSep} from "path";

export function sortFilePaths(filePaths: string[]): string[] {
  return filePaths.sort(comparePaths);
}

// Compare 2 paths: pathA and pathB
// return -1 if pathA < pathB,
//         1 if pathA > pathB,
//         0 if pathA = pathB,
function comparePaths(pathA: string, pathB: string): number {
  function pathDiffContainsFolders(pathDiff: string) {
    return pathDiff.indexOf(pathSep) !== -1;
  }

  const pathAdiffByPathB = getPathsDiff(pathA, pathB);
  const pathBdiffByPathA = getPathsDiff(pathB, pathA);
  const isPathAdiffByPathBContainsFolder = pathDiffContainsFolders(pathAdiffByPathB);
  const isPathBdiffByPathBContainsFolder = pathDiffContainsFolders(pathBdiffByPathA);
  if (!isPathAdiffByPathBContainsFolder && isPathBdiffByPathBContainsFolder) {
    return -1;
  } else if (isPathAdiffByPathBContainsFolder && !isPathBdiffByPathBContainsFolder) {
    return 1;
  } else {
    return pathAdiffByPathB < pathBdiffByPathA ? -1 : pathAdiffByPathB > pathBdiffByPathA ? 1 : 0;
  }
}

function getPathsDiff(source: string, diffBy: string) {
  const relativeArray = pathRelative(diffBy, source).split(`..${pathSep}`);
  return relativeArray[relativeArray.length - 1];
}

export function groupBy(array: any[], key: any) {
  const groupedArray = array.reduce((acc, curr) => {
    (acc[curr[key]] = acc[curr[key]] || []).push(curr);

    return acc;
  }, {});

  return groupedArray;
}

export function translateTruffleVariables(truffleVariables: any): any {
  // FIXME: convert variables.
  const ret: any = {};

  // so for key in object values. call the recursive looper.
  for (const [k, v] of Object.entries(truffleVariables)) {
    // k  // Type is string
    // v  // Type is any/Result from codec land.
    ret[k] = translate(<Result>v);
  }

  return ret;
}

// TODO: this function will be used in the future for displaying circular structures
function formatCircular(loopLength: number): string {
  return `[Circular (=up ${loopLength})]`;
}

function enumTypeName(enumType: Format.Types.EnumType): string {
  return (enumType.kind === "local" ? enumType.definingContractName + "." : "") + enumType.typeName;
}

function enumFullName(value: Format.Values.EnumValue): string {
  switch (value.type.kind) {
    case "local":
      return `${value.type.definingContractName}.${value.type.typeName}.${value.value.name}`;
    case "global":
      return `${value.type.typeName}.${value.value.name}`;
  }
}

type TranslatedResult = {
  value: any;
  solidity: Format.Values.Result;
};

function translateContractValue(value: Format.Values.ContractValueInfo): string {
  switch (value.kind) {
    case "known":
      return `${value.address} (${value.class.typeName})`;
    case "unknown":
      return `${value.address} of unknown class`;
  }
}

/**
 *
 * @param variable Parse a debug variable and return the formatted value.
 *
 * If the value can't be transformed then the raw version is returned.
 * @returns the formatted value.
 */
export function translate(variable: Format.Values.Result, breaklength: number = 20): TranslatedResult {
  switch (variable.kind) {
    case "value":
      switch (variable.type.typeClass) {
        case "uint":
        case "int":
          return {
            value: (<UintValue>variable).value.asBN.toString(),
            solidity: variable,
          };
        case "fixed":
        case "ufixed":
          //note: because this is just for display, we don't bother adjusting the magic values Big.NE or Big.PE;
          //we'll trust those to their defaults
          return {
            value: (<FixedValue>variable).value.asBig.toString(),
            solidity: variable,
          };
        case "bool":
          return {
            value: (<BoolValue>variable).value.asBoolean,
            solidity: variable,
          };
        case "bytes":
          switch (variable.type.kind) {
            case "static":
              return {
                value: (<BytesStaticValue>variable).value.asHex,
                solidity: variable,
              };
            case "dynamic":
              return {
                value: `hex: ${(<BytesDynamicValue>variable).value.asHex.slice(2)}`,
                solidity: variable,
              };
            default:
              return {
                value: (<BytesValue>variable).value.asHex,
                solidity: variable,
              };
          }
        case "address":
          return {
            value: (<AddressValue>variable).value.asAddress,
            solidity: variable,
          };
        case "string": {
          switch ((<StringValue>variable).value.kind) {
            case "valid":
              return {
                value: (<StringValueInfoValid>variable.value).asString,
                solidity: variable,
              };
            case "malformed":
              //note: this will turn malformed utf-8 into replacement characters (U+FFFD)
              //note we need to cut off the 0x prefix
              return {
                value: Buffer.from((<StringValueInfoMalformed>variable.value).asHex.slice(2), "hex").toString(),
                solidity: variable,
              };
            default:
              return {
                value: variable.value,
                solidity: variable,
              };
          }
        }
        case "array": {
          const coercedResult = <ArrayValue>variable;
          if (coercedResult.reference !== undefined) {
            return {
              value: formatCircular(coercedResult.reference),
              solidity: variable,
            };
          }
          return {
            // tail loop
            value: coercedResult.value.map((element: Result) => translate(element)),
            solidity: variable,
          };
        }
        case "mapping":
          return {
            value: new Map(
              (<Format.Values.MappingValue>variable).value.map(({key, value}) => [translate(key), translate(value)])
            ),
            solidity: variable,
          };

        case "struct": {
          const coercedResult = <Format.Values.StructValue>variable;
          if (coercedResult.reference !== undefined) {
            return {
              value: formatCircular(coercedResult.reference),
              solidity: variable,
            };
          }
          return {
            value: Object.assign(
              {},
              ...coercedResult.value.map(({name, value}) => ({
                [name]: translate(value),
              }))
            ),
            solidity: variable,
          };
        }
        case "userDefinedValueType": {
          const typeName = Format.Types.typeStringWithoutLocation(variable.type);
          const coercedResult = <Format.Values.UserDefinedValueTypeValue>variable;
          const inspectOfUnderlying = translate(coercedResult.value);
          return {
            value: `${typeName}.wrap(${inspectOfUnderlying})`, //note only the underlying part is stylized
            solidity: variable,
          };
        }
        case "tuple": {
          const coercedResult = <Format.Values.TupleValue>variable;
          //if everything is named, do same as with struct.
          //if not, just do an array.
          //(good behavior in the mixed case is hard, unfortunately)
          if (coercedResult.value.every(({name}) => name)) {
            return {
              value: Object.assign(
                {},
                ...coercedResult.value.map(({name, value}) => ({
                  [<string>name]: translate(value),
                }))
              ),
              solidity: variable,
            };
          } else {
            return {
              value: coercedResult.value.map(({value}) => translate(value)),
              solidity: variable,
            };
          }
        }
        case "type": {
          switch (variable.type.type.typeClass) {
            case "contract":
              //same as struct case but w/o circularity check
              return {
                value: Object.assign(
                  {},
                  ...(<Format.Values.TypeValueContract>variable).value.map(({name, value}) => ({
                    [name]: translate(value),
                  }))
                ),
                solidity: variable,
              };
            case "enum":
            default: {
              return {
                value: enumTypeName(variable.type.type),
                solidity: variable,
              };
            }
          }
        }
        case "magic":
          return {
            value: Object.assign(
              {},
              ...Object.entries((<Format.Values.MagicValue>variable).value).map(([key, value]) => ({
                [key]: translate(value),
              }))
            ),
            solidity: variable,
          };
        case "enum": {
          return {
            value: enumFullName(<Format.Values.EnumValue>variable), //not stylized
            solidity: variable,
          };
        }
        case "contract": {
          return {value: translateContractValue((<Format.Values.ContractValue>variable).value), solidity: variable};
        }

        case "function":
          switch (variable.type.visibility) {
            case "external": {
              const coercedResult = <Format.Values.FunctionExternalValue>variable;
              const contractString = translateContractValue(coercedResult.value.contract);
              let firstLine: string;
              switch (coercedResult.value.kind) {
                case "known":
                  firstLine = `[Function: ${coercedResult.value.abi.name} of`;
                  break;
                case "invalid":
                case "unknown":
                  firstLine = `[Function: Unknown selector ${coercedResult.value.selector} of`;
                  break;
              }
              const secondLine = `${contractString}]`;
              const breakingSpace = firstLine.length + secondLine.length + 1 > breaklength ? "\n" : " ";
              //now, put it together
              return {
                value: firstLine + breakingSpace + secondLine,
                solidity: variable,
              };
            }
            case "internal": {
              const coercedResult = <Format.Values.FunctionInternalValue>variable;
              switch (coercedResult.value.kind) {
                case "function":
                  if (coercedResult.value.definedIn) {
                    return {
                      value: `[Function: ${coercedResult.value.definedIn.typeName}.${coercedResult.value.name}]`,
                      solidity: variable,
                    };
                  } else {
                    return {
                      value: `[Function: ${coercedResult.value.name}]`,
                      solidity: variable,
                    };
                  }
                case "exception":
                  return {
                    value:
                      coercedResult.value.deployedProgramCounter === 0
                        ? `[Function: <zero>]`
                        : `[Function: <uninitialized>]`,
                    solidity: variable,
                  };
                case "unknown":
                  const firstLine = `[Function: decoding not supported (raw info:`;
                  const secondLine = `deployed PC=${coercedResult.value.deployedProgramCounter}, constructor PC=${coercedResult.value.constructorProgramCounter})]`;
                  const breakingSpace = firstLine.length + secondLine.length + 1 > breaklength ? "\n" : " ";
                  //now, put it together
                  return {
                    value: firstLine + breakingSpace + secondLine,
                    solidity: variable,
                  };
                default:
                  return {
                    value: "DEFAULT:" + variable.value,
                    solidity: variable,
                  };
              }
            }
            default:
              return {
                value: "DEFAULT:" + variable.value,
                solidity: variable,
              };
          }
        default:
          return {
            value: "DEFAULT:" + variable.value,
            solidity: variable,
          };
      }
    case "error": {
      // debug("variable: %O", variable);
      return {
        value: getErrorResult(variable, breaklength),
        solidity: variable,
      };
    }
  }
}

function getErrorResult(variable: Result, breaklength: number): any {
  const errorResult = <Format.Errors.ErrorResult | Format.Errors.AbiErrorResult>variable; //the hell?? why couldn't it make this inference??
  switch (errorResult.error.kind) {
    case "WrappedError":
      return translate(errorResult.error.error);
    case "UintPaddingError":
      return `Uint has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "IntPaddingError":
      return `Int has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "UfixedPaddingError":
      return `Ufixed has (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "FixedPaddingError":
      return `Fixed has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "BoolOutOfRangeError":
      return `Invalid boolean (numeric value ${errorResult.error.rawAsBN.toString()})`;
    case "BoolPaddingError":
      return `Boolean has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "BytesPaddingError":
      return `Bytestring has extra trailing bytes (padding error) (raw value ${errorResult.error.raw})`;
    case "AddressPaddingError":
      return `Address has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "EnumOutOfRangeError":
      return `Invalid ${enumTypeName(errorResult.error.type)} (numeric value ${errorResult.error.rawAsBN.toString()})`;
    case "EnumPaddingError":
      return `Enum ${enumTypeName(errorResult.error.type)} has incorrect padding (expected padding: ${
        errorResult.error.paddingType
      }) (raw value ${errorResult.error.raw})`;
    case "EnumNotFoundDecodingError":
      return `Unknown enum type ${enumTypeName(errorResult.error.type)} of id ${
        errorResult.error.type.id
      } (numeric value ${errorResult.error.rawAsBN.toString()})`;
    case "ContractPaddingError":
      return `Contract address has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "FunctionExternalNonStackPaddingError":
      return `External function has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "FunctionExternalStackPaddingError":
      return `External function address or selector has extra leading bytes (padding error) (raw address ${errorResult.error.rawAddress}, raw selector ${errorResult.error.rawSelector})`;
    case "FunctionInternalPaddingError":
      return `Internal function has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
    case "NoSuchInternalFunctionError":
      return `Invalid function (Deployed PC=${errorResult.error.deployedProgramCounter}, constructor PC=${errorResult.error.constructorProgramCounter}) of contract ${errorResult.error.context.typeName}`;
    case "DeployedFunctionInConstructorError":
      return `Deployed-style function (PC=${errorResult.error.deployedProgramCounter}) in constructor`;
    case "MalformedInternalFunctionError":
      return `Malformed internal function w/constructor PC only (value: ${errorResult.error.constructorProgramCounter})`;
    case "IndexedReferenceTypeError": //for this one we'll bother with some line-wrapping
      const firstLine = `Cannot decode indexed parameter of reference type ${errorResult.error.type.typeClass}`;
      const secondLine = `(raw value ${errorResult.error.raw})`;
      const breakingSpace = firstLine.length + secondLine.length + 1 > breaklength ? "\n" : " ";
      return firstLine + breakingSpace + secondLine;
    case "OverlongArraysAndStringsNotImplementedError":
      return `Array or string is too long (length ${errorResult.error.lengthAsBN.toString()}); decoding is not supported`;
    case "OverlargePointersNotImplementedError":
      return `Pointer is too large (value ${errorResult.error.pointerAsBN.toString()}); decoding is not supported`;
    case "UserDefinedTypeNotFoundError":
    case "UnsupportedConstantError":
    case "UnusedImmutableError":
    case "ReadErrorStack":
    case "ReadErrorStorage":
    case "ReadErrorBytes":
      return Exception.message(errorResult.error); //yay, these five are already defined!
  }
}
