import {Constants} from '../../Constants';
import {bigIntMath} from '../../helpers/bigIntMath';

export function validateSolidityType(value: string, type: string): string | undefined {
  if (type.match(Constants.validationRegexps.types.simpleMapping)) {
    // Mapping type
    return;
  }
  if (type.match(Constants.validationRegexps.types.simpleArray)) {
    return validateSimpleArray(value, type.split('[]')[0]);
  }

  return validateElementaryType(value, type);
}

function validateElementaryType(value: string, type: string): string | undefined {
  if (type.match(Constants.validationRegexps.types.solidityInteger)) {
    return validateNumber(value, type);
  }

  switch (type) {
    case Constants.solidityTypes.string:
      return;
    case Constants.solidityTypes.bool:
      return value === 'true' || value === 'false' ? undefined : Constants.validationMessages.valueShouldBeBool;
    case Constants.solidityTypes.address:
      return value.match(Constants.validationRegexps.types.solidityAddress)
        ? undefined
        : Constants.validationMessages.valueShouldBeSolidityAddress;
    default:
      // TODO: validate other types
      return;
  }
}

function validateNumber(value: string, type: string): string | undefined {
  if (!value.match(Constants.validationRegexps.onlyNumber)) {
    return Constants.validationMessages.valueShouldBeNumber;
  }

  if (type.match(Constants.validationRegexps.types.solidityUint)) {
    const pow = type.split(Constants.solidityTypes.uint)[1];
    const maxUint = bigIntMath.pow(BigInt(2), parseInt(pow, 10)) - BigInt(1);
    const valueAsNumber = BigInt(parseInt(value, 10));
    if (valueAsNumber < BigInt(0) || valueAsNumber > maxUint) {
      return Constants.validationMessages.valueShouldBePositiveAndCanSafelyStoreUpToBits(pow);
    }
  }

  if (type.match(Constants.validationRegexps.types.solidityInt)) {
    const pow = type.split(Constants.solidityTypes.int)[1];
    const maxInt = bigIntMath.pow(BigInt(2), parseInt(pow, 10) - 1) - BigInt(1);
    const minInt = -maxInt;
    const valueAsNumber = BigInt(parseInt(value, 10));
    if (valueAsNumber < minInt || valueAsNumber > maxInt) {
      return Constants.validationMessages.valueCanSafelyStoreUpToBits(pow);
    }
  }

  return;
}

function validateSimpleArray(value: string, elementsType: string): string | undefined {
  if (!value.match(Constants.validationRegexps.array)) {
    return Constants.validationMessages.valueShouldBeArray;
  }

  const values = value.slice(1, value.length - 1).split(',');

  if (values.length === 0 || (values.length === 1 && values[0] === '')) {
    return;
  }

  const invalidValues = values.filter((element) => {
    const result = validateSolidityType(element.trim(), elementsType);
    return !!result;
  });

  if (invalidValues.length > 0) {
    return Constants.validationMessages.arrayElementsShouldBeValid(elementsType);
  }

  return;
}
