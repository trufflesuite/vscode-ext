// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ResourceGroups } from 'azure-arm-resource/lib/resource/operations';
import { ConsortiumResource, MemberResource } from '../ARMBlockchain';
import { Constants } from '../Constants';
import { Debounce } from './debounceValidation';
import { Validator } from './validator';

const debounce = new Debounce();

export namespace AzureBlockchainServiceValidator {
  export async function validateAccessPassword(password: string): Promise<string | null> {
    return new Validator(password)
      .isNotEmpty()
      .hasLowerCase()
      .hasUpperCase()
      .hasDigit()
      .hasSpecialChar(Constants.validationRegexps.specialChars)
      .hasNotUnallowedChar(Constants.validationRegexps.unallowedChars)
      .inLengthRange(12, 72)
      .getErrors();
  }

  export async function validateResourceGroupName(
    name: string,
    resourceGroups: ResourceGroups,
  ): Promise<string | null> {

    if (!name.match(new RegExp(/^[-\w\._\(\)]+$/))) {
      return Constants.validationMessages.invalidResourceGroupName;
    }
    const timeOverFunction = buildTimeOverFunction(
      name,
      resourceGroups.checkExistence.bind(resourceGroups),
      Constants.validationMessages.resourceGroupAlreadyExists,
    );

    return await debounce.debounced(timeOverFunction);
  }

  export async function validateConsortiumName(
    name: string,
    consortiumResource: ConsortiumResource,
  ): Promise<string | null> {
    const timeOverFunction = buildTimeOverFunction(
      name,
      consortiumResource.checkExistence.bind(consortiumResource),
    );

    return await debounce.debounced(timeOverFunction);
  }

  export async function validateMemberName(
    name: string,
    memberResource: MemberResource,
  ) {
    const timeOverFunction = buildTimeOverFunction(
      name,
      memberResource.checkExistence.bind(memberResource),
    );

    return await debounce.debounced(timeOverFunction);
  }

  function buildTimeOverFunction(
    name: string,
    checkExistence: (name: string) => Promise<any>,
    errorFunction?: (error: string) => string,
  ): () => Promise<string | null> {
    return async () => {
      const validator = new Validator(name);

      await validator.isAvailable(
        checkExistence,
        errorFunction,
      );

      return validator.getErrors();
    };
  }
}
