// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import sinon from "sinon";
import uuid from "uuid";
import {IEventGridDto} from "../src/ARMBlockchain";
import {Constants} from "../src/Constants";

describe("Event Grid Resource Explorer", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("loadEventGridItems returns succeeded event grid list", async () => {
    // loadEventGridItems
    const eventGridList = getEventGridList();
    const expectedNumberOfEventGrid = (await eventGridList).filter(
      (eg) => eg.properties.provisioningState === Constants.provisioningState.succeeded
    ).length;

    const eventGridResourceExplorerRequire = require("../src/resourceExplorers/EventGridResourceExplorer");
    const eventGridResourceExplorer = eventGridResourceExplorerRequire.EventGridResourceExplorer;

    const eventGridClient = {
      eventGridResource: {getEventGridList: async () => await getEventGridList()},
    };

    // Act
    const result = await eventGridResourceExplorer.prototype.loadEventGridItems(eventGridClient);

    // Assert
    assert.strictEqual(
      result.length,
      expectedNumberOfEventGrid,
      `loadEventGridItems should return only ${expectedNumberOfEventGrid} event grids.`
    );
  });

  const eventGridNameList = {
    eventGrid1: "eventGrid1",
    eventGrid2: "eventGrid2",
  };

  async function getEventGridList(): Promise<IEventGridDto[]> {
    return [
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: eventGridNameList.eventGrid1,
        properties: {
          endpoint: uuid.v4(),
          inputSchema: uuid.v4(),
          metricResourceId: uuid.v4(),
          provisioningState: Constants.provisioningState.succeeded,
        },
        tags: uuid.v4(),
        type: uuid.v4(),
      },
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: eventGridNameList.eventGrid2,
        properties: {
          endpoint: uuid.v4(),
          inputSchema: uuid.v4(),
          metricResourceId: uuid.v4(),
          provisioningState: Constants.provisioningState.stopped,
        },
        tags: uuid.v4(),
        type: uuid.v4(),
      },
    ];
  }
});
