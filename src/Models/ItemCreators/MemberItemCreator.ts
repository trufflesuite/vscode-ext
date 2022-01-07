// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Member } from "../TreeItems";
import { ItemCreator } from "./ItemCreator";

export class MemberItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string; type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[{ fieldName: "label", type: "string" }]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [obj.label];
  }

  protected createFromObject(label: string): Member {
    return new Member(label);
  }
}
