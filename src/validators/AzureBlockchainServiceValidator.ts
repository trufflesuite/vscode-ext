// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ResourceGroups } from "azure-arm-resource/lib/resource/operations";
import { ConsortiumResource, MemberResource } from "../ARMBlockchain";
import { Constants } from "../Constants";
import { Debounce } from "./debounceValidation";
import { Validator } from "./validator";

const debounce = new Debounce();

export namespace AzureBlockchainServiceValidator {
  const { specialChars, forbiddenChars } = Constants.validationRegexps;
  const { unresolvedSymbols } = Constants.validationMessages;
  const { azureBlockchainResourceName, resourceGroup } = Constants.lengthParam;

  export async function validateAccessPassword(password: string): Promise<string | null> {
    return new Validator(password)
      .isNotEmpty()
      .hasLowerCase()
      .hasUpperCase()
      .hasDigit()
      .hasSpecialChar(specialChars.password)
      .hasNoForbiddenChar(
        forbiddenChars.password,
        unresolvedSymbols(Constants.validationMessages.forbiddenChars.password)
      )
      .inLengthRange(Constants.lengthParam.password.min, Constants.lengthParam.password.max)
      .getErrors();
  }

  export async function validateResourceGroupName(
    name: string,
    resourceGroups: ResourceGroups
  ): Promise<string | null> {
    const errors = new Validator(name)
      .isNotEmpty()
      .hasSpecialChar(specialChars.resourceGroupName)
      .hasNoForbiddenChar(
        forbiddenChars.dotAtTheEnd,
        unresolvedSymbols(Constants.validationMessages.forbiddenChars.dotAtTheEnd)
      )
      .hasNoForbiddenChar(
        forbiddenChars.resourceGroupName,
        unresolvedSymbols(Constants.validationMessages.forbiddenChars.resourceGroupName)
      )
      .inLengthRange(resourceGroup.min, resourceGroup.max)
      .getErrors();

    if (errors) {
      return Constants.validationMessages.invalidResourceGroupName;
    }

    const timeOverFunction = buildTimeOverFunction(
      name,
      resourceGroups.checkExistence.bind(resourceGroups),
      Constants.validationMessages.resourceGroupAlreadyExists
    );

    return await debounce.debounced(timeOverFunction);
  }

  export async function validateAzureBlockchainResourceName(
    name: string,
    resource: ConsortiumResource | MemberResource
  ): Promise<string | null> {
    const errors = new Validator(name)
      .isNotEmpty()
      .hasSpecialChar(specialChars.azureBlockchainResourceName)
      .inLengthRange(azureBlockchainResourceName.min, azureBlockchainResourceName.max)
      .getErrors();

    if (errors) {
      return Constants.validationMessages.invalidAzureName;
    }

    const timeOverFunction = buildTimeOverFunction(name, resource.checkExistence.bind(resource));

    return await debounce.debounced(timeOverFunction);
  }

  export function validateBDMApplicationName(name: string, existingNames: string[]) {
    const errors = new Validator(name)
      .isNotEmpty()
      .hasSpecialChar(specialChars.azureBlockchainResourceName)
      .inLengthRange(azureBlockchainResourceName.min, azureBlockchainResourceName.max)
      .getErrors();

    if (errors) {
      return Constants.validationMessages.invalidBDMApplicationName;
    }

    if (existingNames.includes(name)) {
      return Constants.validationMessages.bdmApplicationNameExist;
    }

    return null;
  }

  function buildTimeOverFunction(
    name: string,
    checkExistence: (name: string) => Promise<any>,
    errorFunction?: (error: string) => string
  ): () => Promise<string | null> {
    return async () => {
      const validator = new Validator(name);

      await validator.isAvailable(checkExistence, errorFunction);

      return validator.getErrors();
    };
  }
}
