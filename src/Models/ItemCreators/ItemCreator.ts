// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Telemetry} from "../../TelemetryClient";
import {IExtensionItem} from "../TreeItems";

export abstract class ItemCreator {
  public create(obj: {[key: string]: any}): IExtensionItem {
    const requiredFields = this.getRequiredFields() || [];

    this.checkRequiredFields(obj, requiredFields);

    const args = this.getAdditionalConstructorArguments(obj);

    return this.createFromObject(...args);
  }

  protected abstract createFromObject(...args: any[]): IExtensionItem;

  protected getRequiredFields(): Array<{fieldName: string; type: string}> {
    return [{fieldName: "itemType", type: "number"}];
  }

  protected getAdditionalConstructorArguments(_obj: {[key: string]: any}): any[] {
    return [];
  }

  private checkRequiredFields(
    obj: {[key: string]: any},
    requiredFields: Array<{fieldName: string; type: string}>
  ): void {
    requiredFields.forEach((item) => {
      const field = obj[item.fieldName];
      if (field === undefined || field === null) {
        Telemetry.sendException(new Error(`Missed required field ${item.fieldName}.`));
        throw new Error(`Missed required field ${item.fieldName}. JSON: ${JSON.stringify(obj)}`);
      }

      if ((item.type === "array" && Array.isArray(field)) || typeof field === item.type) {
        return;
      }

      Telemetry.sendException(new Error(`Required field ${item.fieldName} should be type ${item.type}`));
      throw new Error(`Required field ${item.fieldName} should be type ${item.type}. JSON: ${JSON.stringify(obj)}`);
    });
  }
}
