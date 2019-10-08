// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import React from 'react';
import {
  ArrayProperty,
  NotSupportedProperty,
  SimpleProperty,
  StructProperty,
} from '../stateSection/contractProperty';

// if it is array - it will fail with string key
// but mapping allows any type of keys
function IsMappingBehavior(property) {
  if (property.inputs.length > 0
    && property.inputs[0].type.startsWith('uint')
    && property.inputs[0].name === '') {
    let isMappingBehavior = true;
    const someStringIndex = 'ind_1';
    try {
      property.method(someStringIndex).call();
    } catch {
      isMappingBehavior = false;
    }
    return isMappingBehavior;
  }
  return true;
}

export const GetStateComponent = (property, index) => {
  const unsupportedComponents = property.outputs.find((output) => !!output.components);
  if (unsupportedComponents) {
    return (
      <NotSupportedProperty
        key={index}
        property={property}
      />
    );
  }

  if (property.inputs.length > 0) {
    if (IsMappingBehavior(property)) {
      return (
        <NotSupportedProperty
          key={index}
          property={property}
        />
      );
    }
    return (
      <ArrayProperty
        key={index}
        property={property}
      />
    );
  }

  if (property.outputs > 1 || property.outputs[0].name) {
    return (
      <StructProperty
        key={index}
        property={property}
      />
    );
  }

  return (
    <SimpleProperty
      key={index}
      property={property}
    />
  );
};
