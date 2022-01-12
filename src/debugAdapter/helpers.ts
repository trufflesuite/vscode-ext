// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

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

  // so for key in object values.
  for (const [k, v] of Object.entries(truffleVariables)) {
    // k  // Type is string
    // v  // Type is any

    // k = msg
    // v = {}

    ret[k] = v;
  }

  /*
  each has {type: any kind: string value: any}
  kind: 'value' // seems to be most values
  type: {
  typeClass: string
  variable: string
  }

  value: {
    anything really...
  }
  */

  // switch (this.result.kind) {

  // }
  return ret;
}

/**
 * This class is meant to be used with Node's
 * [util.inspect()](https://nodejs.org/api/util.html#util_util_inspect_object_options)
 * function.  Given a [[Format.Values.Result]] `value`, one can use
 * `new ResultInspector(value)` to create a ResultInspector for that value,
 * which can be used with util.inspect() to create a human-readable string
 * representing the value.
 *
 * @example
 * Suppose `value` is a Result.  In Node, the following would print to the
 * console a human-readable representation of `value`, with colors enabled,
 * no maximum depth, and no maximum array length, and lines (usually) no
 * longer than 80 characters:
 * ```javascript
 * console.log(
 *   util.inspect(
 *     new ResultInspector(value),
 *     {
 *       colors: true,
 *       depth: null,
 *       maxArrayLength: null,
 *       breakLength: 80
 *     }
 *   )
 * );
 * ```
 * Of course, there are many other ways to use util.inspect; see Node's
 * documentation, linked above, for more.
 */

type DebugVariable = any;

type TypeClass = {
  typeClass: string;
  variable: string;
  kind: string;
};
type SessionVariable = {
  formatted: any;
  type: TypeClass;
  kind: string;
  value: DebugVariable;
};

/**
 *
 * @param variable Parse a debug variable and return the formatted value.
 *
 * If the value can't be transformed then the raw version is returned.
 * @returns the formatted value.
 */
export function translate(variable: SessionVariable): any {
  switch (variable.kind) {
    case "value":
      switch (variable.type.typeClass) {
        case "uint":
        case "int":
          return variable.value.asBN.toString();
        case "fixed":
        case "ufixed":
          //note: because this is just for display, we don't bother adjusting the magic values Big.NE or Big.PE;
          //we'll trust those to their defaults
          return variable.value.asBig.toString();
        case "bool":
          return variable.value.asBoolean;
        case "bytes":
          // eslint-disable-next-line no-case-declarations
          const hex = variable.value.asHex;
          switch (variable.type.kind) {
            case "static":
              return hex;
            case "dynamic":
              return `hex'${hex.slice(2)}'`;
            default:
              return hex;
          }
        case "address":
          return variable.value.asAddress;
        case "string": {
          switch (variable.value.kind) {
            case "valid":
              return variable.value.asString;
            case "malformed":
              //note: this will turn malformed utf-8 into replacement characters (U+FFFD)
              //note we need to cut off the 0x prefix
              return Buffer.from(variable.value.asHex.slice(2), "hex").toString();
            default:
              return variable.value;
          }
        }

        //   case "array": {
        //     let coercedResult = <Format.Values.ArrayValue>this.result;
        //     if (coercedResult.reference !== undefined) {
        //       return formatCircular(coercedResult.reference, options);
        //     }
        //     return util.inspect(
        //       coercedResult.value.map(element => new ResultInspector(element)),
        //       options
        //     );
        //   }
        //   case "mapping":
        //     return util.inspect(
        //       new Map(
        //         (<Format.Values.MappingValue>(
        //           this.result
        //         )).value.map(({ key, value }) => [
        //           new ResultInspector(key),
        //           new ResultInspector(value)
        //         ])
        //       ),
        //       options
        //     );
        //   case "struct": {
        //     let coercedResult = <Format.Values.StructValue>this.result;
        //     if (coercedResult.reference !== undefined) {
        //       return formatCircular(coercedResult.reference, options);
        //     }
        //     return util.inspect(
        //       Object.assign(
        //         {},
        //         ...coercedResult.value.map(({ name, value }) => ({
        //           [name]: new ResultInspector(value)
        //         }))
        //       ),
        //       options
        //     );
        //   }
        //   case "userDefinedValueType": {
        //     const typeName = Format.Types.typeStringWithoutLocation(this.result.type);
        //     const coercedResult = <Format.Values.UserDefinedValueTypeValue>this.result;
        //     const inspectOfUnderlying = util.inspect(
        //       new ResultInspector(coercedResult.value),
        //       options
        //     );
        //     return `${typeName}.wrap(${inspectOfUnderlying})`; //note only the underlying part is stylized
        //   }
        //   case "tuple": {
        //     let coercedResult = <Format.Values.TupleValue>this.result;
        //     //if everything is named, do same as with struct.
        //     //if not, just do an array.
        //     //(good behavior in the mixed case is hard, unfortunately)
        //     if (coercedResult.value.every(({ name }) => name)) {
        //       return util.inspect(
        //         Object.assign(
        //           {},
        //           ...coercedResult.value.map(({ name, value }) => ({
        //             [name]: new ResultInspector(value)
        //           }))
        //         ),
        //         options
        //       );
        //     } else {
        //       return util.inspect(
        //         coercedResult.value.map(
        //           ({ value }) => new ResultInspector(value)
        //         ),
        //         options
        //       );
        //     }
        //   }
        //   case "type": {
        //     switch (this.result.type.type.typeClass) {
        //       case "contract":
        //         //same as struct case but w/o circularity check
        //         return util.inspect(
        //           Object.assign(
        //             {},
        //             ...(<Format.Values.TypeValueContract>this.result).value.map(
        //               ({ name, value }) => ({
        //                 [name]: new ResultInspector(value)
        //               })
        //             )
        //           ),
        //           options
        //         );
        //       case "enum": {
        //         return enumTypeName(this.result.type.type);
        //       }
        //     }
        //   }
        //   case "magic":
        //     return util.inspect(
        //       Object.assign(
        //         {},
        //         ...Object.entries(
        //           (<Format.Values.MagicValue>this.result).value
        //         ).map(([key, value]) => ({ [key]: new ResultInspector(value) }))
        //       ),
        //       options
        //     );
        //   case "enum": {
        //     return enumFullName(<Format.Values.EnumValue>this.result); //not stylized
        //   }
        //   case "contract": {
        //     return util.inspect(
        //       new ContractInfoInspector(
        //         (<Format.Values.ContractValue>this.result).value
        //       ),
        //       options
        //     );
        //   }
        //   case "function":
        //     switch (this.result.type.visibility) {
        //       case "external": {
        //         let coercedResult = <Format.Values.FunctionExternalValue>(
        //           this.result
        //         );
        //         let contractString = util.inspect(
        //           new ContractInfoInspector(coercedResult.value.contract),
        //           { ...cleanStylize(options), colors: false }
        //         );
        //         let firstLine: string;
        //         switch (coercedResult.value.kind) {
        //           case "known":
        //             firstLine = `[Function: ${coercedResult.value.abi.name} of`;
        //             break;
        //           case "invalid":
        //           case "unknown":
        //             firstLine = `[Function: Unknown selector ${coercedResult.value.selector} of`;
        //             break;
        //         }
        //         let secondLine = `${contractString}]`;
        //         let breakingSpace =
        //           firstLine.length + secondLine.length + 1 > options.breakLength
        //             ? "\n"
        //             : " ";
        //         //now, put it together
        //         return options.stylize(
        //           firstLine + breakingSpace + secondLine,
        //           "special"
        //         );
        //       }
        //       case "internal": {
        //         let coercedResult = <Format.Values.FunctionInternalValue>(
        //           this.result
        //         );
        //         switch (coercedResult.value.kind) {
        //           case "function":
        //             if (coercedResult.value.definedIn) {
        //               return options.stylize(
        //                 `[Function: ${coercedResult.value.definedIn.typeName}.${coercedResult.value.name}]`,
        //                 "special"
        //               );
        //             } else {
        //               return options.stylize(
        //                 `[Function: ${coercedResult.value.name}]`,
        //                 "special"
        //               );
        //             }
        //           case "exception":
        //             return coercedResult.value.deployedProgramCounter === 0
        //               ? options.stylize(`[Function: <zero>]`, "special")
        //               : options.stylize(
        //                   `[Function: <uninitialized>]`,
        //                   "special"
        //                 );
        //           case "unknown":
        //             let firstLine = `[Function: decoding not supported (raw info:`;
        //             let secondLine = `deployed PC=${coercedResult.value.deployedProgramCounter}, constructor PC=${coercedResult.value.constructorProgramCounter})]`;
        //             let breakingSpace =
        //               firstLine.length + secondLine.length + 1 >
        //               options.breakLength
        //                 ? "\n"
        //                 : " ";
        //             //now, put it together
        //             return options.stylize(
        //               firstLine + breakingSpace + secondLine,
        //               "special"
        //             );
        //         }
        //       }
        //     }
        // }
        // case "error": {
        // debug("this.result: %O", this.result);
        // let errorResult = <Format.Errors.ErrorResult>this.result; //the hell?? why couldn't it make this inference??
        // switch (errorResult.error.kind) {
        //   case "WrappedError":
        //     return util.inspect(
        //       new ResultInspector(errorResult.error.error),
        //       options
        //     );
        //   case "UintPaddingError":
        //     return `Uint has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "IntPaddingError":
        //     return `Int has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "UintPaddingError":
        //     return `Ufixed has (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "FixedPaddingError":
        //     return `Fixed has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "BoolOutOfRangeError":
        //     return `Invalid boolean (numeric value ${errorResult.error.rawAsBN.toString()})`;
        //   case "BoolPaddingError":
        //     return `Boolean has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "BytesPaddingError":
        //     return `Bytestring has extra trailing bytes (padding error) (raw value ${errorResult.error.raw})`;
        //   case "AddressPaddingError":
        //     return `Address has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "EnumOutOfRangeError":
        //     return `Invalid ${enumTypeName(
        //       errorResult.error.type
        //     )} (numeric value ${errorResult.error.rawAsBN.toString()})`;
        //   case "EnumPaddingError":
        //     return `Enum ${enumTypeName(
        //       errorResult.error.type
        //     )} has incorrect padding (expected padding: ${
        //       errorResult.error.paddingType
        //     }) (raw value ${errorResult.error.raw})`;
        //   case "EnumNotFoundDecodingError":
        //     return `Unknown enum type ${enumTypeName(
        //       errorResult.error.type
        //     )} of id ${
        //       errorResult.error.type.id
        //     } (numeric value ${errorResult.error.rawAsBN.toString()})`;
        //   case "ContractPaddingError":
        //     return `Contract address has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "FunctionExternalNonStackPaddingError":
        //     return `External function has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "FunctionExternalStackPaddingError":
        //     return `External function address or selector has extra leading bytes (padding error) (raw address ${errorResult.error.rawAddress}, raw selector ${errorResult.error.rawSelector})`;
        //   case "FunctionInternalPaddingError":
        //     return `Internal function has incorrect padding (expected padding: ${errorResult.error.paddingType}) (raw value ${errorResult.error.raw})`;
        //   case "NoSuchInternalFunctionError":
        //     return `Invalid function (Deployed PC=${errorResult.error.deployedProgramCounter}, constructor PC=${errorResult.error.constructorProgramCounter}) of contract ${errorResult.error.context.typeName}`;
        //   case "DeployedFunctionInConstructorError":
        //     return `Deployed-style function (PC=${errorResult.error.deployedProgramCounter}) in constructor`;
        //   case "MalformedInternalFunctionError":
        //     return `Malformed internal function w/constructor PC only (value: ${errorResult.error.constructorProgramCounter})`;
        //   case "IndexedReferenceTypeError": //for this one we'll bother with some line-wrapping
        //     let firstLine = `Cannot decode indexed parameter of reference type ${errorResult.error.type.typeClass}`;
        //     let secondLine = `(raw value ${errorResult.error.raw})`;
        //     let breakingSpace =
        //       firstLine.length + secondLine.length + 1 > options.breakLength
        //         ? "\n"
        //         : " ";
        //     return firstLine + breakingSpace + secondLine;
        //   case "OverlongArraysAndStringsNotImplementedError":
        //     return `Array or string is too long (length ${errorResult.error.lengthAsBN.toString()}); decoding is not supported`;
        //   case "OverlargePointersNotImplementedError":
        //     return `Pointer is too large (value ${errorResult.error.pointerAsBN.toString()}); decoding is not supported`;
        //   case "UserDefinedTypeNotFoundError":
        //   case "UnsupportedConstantError":
        //   case "UnusedImmutableError":
        //   case "ReadErrorStack":
        //   case "ReadErrorStorage":
        //   case "ReadErrorBytes":
        //     return Exception.message(errorResult.error); //yay, these five are already defined!
        // }
        //   break;
        // }}
        default:
          return variable.value;
      }
    default:
      return variable.value;
  }
}
