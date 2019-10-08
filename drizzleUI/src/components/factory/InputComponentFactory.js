// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../constants';
import React from 'react';
import {
  AddressInput,
  ArrayInput,
  BooleanInput,
  EnumInput,
  IntegerInput,
  TextInput,
  UnsupportedInput
} from '../executionSection/inputControlsCollection';

const { arrayTypeRegexp, intInputs, variableTypes } = Constants.executionSection;
export function createInputComponent(input, handleInputChange, updateValidationResult, index, extendedData) {
  if (input.type.match(arrayTypeRegexp)) {
    return <ArrayInput
      key={index}
      item={input}
      handleInputChange={handleInputChange}
      updateValidationResult={updateValidationResult}
    />;
  }
  if (input.type === variableTypes.string) {
    return <TextInput
      key={index}
      item={input}
      handleInputChange={handleInputChange}
    />;
  }

  if (input.type === variableTypes.address) {
    return <AddressInput
      key={index}
      item={input}
      handleInputChange={handleInputChange}
      updateValidationResult={updateValidationResult}
    />;
  }

  if (input.type === variableTypes.bool) {
    return <BooleanInput
      key={index}
      item={input}
      handleInputChange={handleInputChange}
    />;
  }

  if (!!intInputs[input.type]) {
    // enums section
    const relatedEnum = extendedData.enumsInfo
      .methods[extendedData.executedMethod] &&
      extendedData.enumsInfo
        .methods[extendedData.executedMethod][input.name];
    if (relatedEnum) {
      return <EnumInput
        title={input.name}
        items={relatedEnum}
        handleInputChange={handleInputChange}
      />;
    }
    // end of enums section
    const { min, max, pow } = intInputs[input.type];

    return <IntegerInput
      key={index}
      item={input}
      handleInputChange={handleInputChange}
      min={min}
      max={max}
      pow={pow}
      updateValidationResult={updateValidationResult}
    />;
  }

  return <UnsupportedInput
    key={index}
    item={input}
    handleInputChange={handleInputChange}
  />;
}
